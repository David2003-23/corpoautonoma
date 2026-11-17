package com.corpoautonoma.inventario;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Contenedor nativo de la app de inventario. La interfaz es la misma app web
 * (assets/web), servida desde un origen https interno para que funcionen la
 * cámara, IndexedDB y el resto de APIs del navegador.
 */
public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + HOST + "/index.html";

    private static final int REQ_PERM_WEBCAM = 1;
    private static final int REQ_PERM_PHOTO = 2;
    private static final int REQ_PERM_STORAGE = 3;
    private static final int REQ_CAPTURE = 10;
    private static final int REQ_PICK = 11;

    private WebView web;
    private PermissionRequest pendingWebPermission;
    private ValueCallback<Uri[]> fileCallback;
    private File pendingPhoto;
    /** Archivos que la app web está escribiendo por partes (PDF y copias de seguridad). */
    private final Map<String, OutFile> outFiles = new ConcurrentHashMap<String, OutFile>();
    private OutFile pendingSave;

    private static class OutFile {
        String name, mime, action;
        File tmp;
        FileOutputStream out;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        int flags = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        if (Build.VERSION.SDK_INT >= 26) flags |= 0x00000010; // SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
        getWindow().getDecorView().setSystemUiVisibility(flags);

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#f4f9f6"));
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setUserAgentString(s.getUserAgentString() + " InventarioApp/1.0");

        web.addJavascriptInterface(new Bridge(), "AndroidApp");
        web.setWebViewClient(new AssetClient());
        web.setWebChromeClient(new Chrome());

        cleanOldFiles();
        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl(START_URL);
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.__back ? window.__back() : false", new ValueCallback<String>() {
            @Override public void onReceiveValue(String handled) {
                if (!"true".equals(handled)) MainActivity.super.onBackPressed();
            }
        });
    }

    // ------------------------------------------------------------------ assets
    private class AssetClient extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
            Uri u = req.getUrl();
            if (!HOST.equals(u.getHost())) return null;
            String path = u.getPath();
            if (path == null || path.equals("/") || path.isEmpty()) path = "/index.html";
            Map<String, String> headers = new HashMap<String, String>();
            headers.put("Cache-Control", "no-cache");
            headers.put("Access-Control-Allow-Origin", "*");
            try {
                InputStream in = getAssets().open("web" + path);
                return new WebResourceResponse(mime(path), "utf-8", 200, "OK", headers, in);
            } catch (IOException e) {
                return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", headers,
                        new ByteArrayInputStream(new byte[0]));
            }
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            Uri u = Uri.parse(url);
            if (HOST.equals(u.getHost())) return false;
            try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
            return true;
        }
    }

    private static String mime(String p) {
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js")) return "application/javascript";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".json") || p.endsWith(".webmanifest")) return "application/json";
        return "application/octet-stream";
    }

    // ------------------------------------------------------- cámara y fotos
    private class Chrome extends WebChromeClient {
        @Override
        public void onPermissionRequest(final PermissionRequest request) {
            runOnUiThread(new Runnable() {
                @Override public void run() {
                    if (hasCamera()) {
                        request.grant(new String[] { PermissionRequest.RESOURCE_VIDEO_CAPTURE });
                    } else {
                        pendingWebPermission = request;
                        requestPermissions(new String[] { Manifest.permission.CAMERA }, REQ_PERM_WEBCAM);
                    }
                }
            });
        }

        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
            if (fileCallback != null) fileCallback.onReceiveValue(null);
            fileCallback = callback;
            if (params.isCaptureEnabled()) {
                if (hasCamera()) launchCamera();
                else requestPermissions(new String[] { Manifest.permission.CAMERA }, REQ_PERM_PHOTO);
            } else {
                try {
                    startActivityForResult(params.createIntent(), REQ_PICK);
                } catch (ActivityNotFoundException e) {
                    fileCallback = null;
                    return false;
                }
            }
            return true;
        }
    }

    private boolean hasCamera() {
        return checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
    }

    private void launchCamera() {
        try {
            pendingPhoto = new File(FilesProvider.dir(this), "foto_" + System.currentTimeMillis() + ".jpg");
            pendingPhoto.createNewFile();
            Uri out = FilesProvider.uriFor(pendingPhoto);
            Intent i = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            i.putExtra(MediaStore.EXTRA_OUTPUT, out);
            i.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivityForResult(i, REQ_CAPTURE);
        } catch (Exception e) {
            toast("No se pudo abrir la cámara");
            finishFileChooser(null);
        }
    }

    private void finishFileChooser(Uri[] result) {
        if (fileCallback != null) fileCallback.onReceiveValue(result);
        fileCallback = null;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQ_CAPTURE) {
            boolean ok = resultCode == RESULT_OK && pendingPhoto != null && pendingPhoto.length() > 0;
            finishFileChooser(ok ? new Uri[] { FilesProvider.uriFor(pendingPhoto) } : null);
            pendingPhoto = null;
        } else if (requestCode == REQ_PICK) {
            finishFileChooser(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        boolean granted = results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED;
        if (requestCode == REQ_PERM_WEBCAM && pendingWebPermission != null) {
            if (granted) pendingWebPermission.grant(new String[] { PermissionRequest.RESOURCE_VIDEO_CAPTURE });
            else pendingWebPermission.deny();
            pendingWebPermission = null;
        } else if (requestCode == REQ_PERM_PHOTO) {
            if (granted) launchCamera();
            else { toast("Se necesita permiso de cámara para tomar la foto"); finishFileChooser(null); }
        } else if (requestCode == REQ_PERM_STORAGE) {
            if (granted && pendingSave != null) finishFile(pendingSave);
            else toast("Se necesita permiso de almacenamiento para guardar el archivo");
            pendingSave = null;
        }
    }

    // ------------------------------------------- archivos (PDF y copias)
    private class Bridge {
        @JavascriptInterface
        public String fileBegin(String name, String mime) throws IOException {
            OutFile f = new OutFile();
            f.name = name.replaceAll("[\\\\/:*?\"<>|]", "_");
            f.mime = mime;
            f.tmp = new File(FilesProvider.dir(MainActivity.this), "tmp_" + UUID.randomUUID() + ".part");
            f.out = new FileOutputStream(f.tmp);
            String id = UUID.randomUUID().toString();
            outFiles.put(id, f);
            return id;
        }

        @JavascriptInterface
        public void fileAppendText(String id, String text) throws IOException {
            OutFile f = outFiles.get(id);
            if (f != null) f.out.write(text.getBytes("UTF-8"));
        }

        @JavascriptInterface
        public void fileAppendBase64(String id, String base64) throws IOException {
            OutFile f = outFiles.get(id);
            if (f != null) f.out.write(Base64.decode(base64, Base64.DEFAULT));
        }

        @JavascriptInterface
        public void fileEnd(String id, String action) throws IOException {
            final OutFile f = outFiles.remove(id);
            if (f == null) return;
            f.out.close();
            f.action = action;
            runOnUiThread(new Runnable() {
                @Override public void run() {
                    if (Build.VERSION.SDK_INT < 29
                            && checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                        pendingSave = f;
                        requestPermissions(new String[] { Manifest.permission.WRITE_EXTERNAL_STORAGE }, REQ_PERM_STORAGE);
                    } else {
                        finishFile(f);
                    }
                }
            });
        }
    }

    /** Copia el archivo terminado a Descargas y luego lo abre o lo comparte. */
    private void finishFile(OutFile f) {
        Uri uri;
        try {
            if (Build.VERSION.SDK_INT >= 29) {
                ContentValues v = new ContentValues();
                v.put("_display_name", f.name);
                v.put("mime_type", f.mime);
                v.put("relative_path", Environment.DIRECTORY_DOWNLOADS);
                uri = getContentResolver().insert(Uri.parse("content://media/external/downloads"), v);
                if (uri == null) throw new IOException("insert");
                OutputStream os = getContentResolver().openOutputStream(uri);
                try { copy(f.tmp, os); } finally { os.close(); }
                f.tmp.delete();
            } else {
                File dl = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                dl.mkdirs();
                FileOutputStream os = new FileOutputStream(new File(dl, f.name));
                try { copy(f.tmp, os); } finally { os.close(); }
                File shared = new File(FilesProvider.dir(this), f.name);
                shared.delete();
                if (!f.tmp.renameTo(shared)) throw new IOException("rename");
                uri = FilesProvider.uriFor(shared);
            }
        } catch (Exception e) {
            f.tmp.delete();
            toast("No se pudo guardar el archivo");
            return;
        }
        jsToast("Guardado en Descargas: " + f.name);
        try {
            Intent i;
            if ("share".equals(f.action)) {
                i = new Intent(Intent.ACTION_SEND);
                i.setType(f.mime);
                i.putExtra(Intent.EXTRA_STREAM, uri);
                i.setClipData(android.content.ClipData.newRawUri(f.name, uri));
                i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                startActivity(Intent.createChooser(i, "Guardar o enviar la copia"));
            } else {
                i = new Intent(Intent.ACTION_VIEW);
                i.setDataAndType(uri, f.mime);
                i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                startActivity(Intent.createChooser(i, "Abrir"));
            }
        } catch (Exception ignored) { /* sin app para abrir/compartir: queda en Descargas */ }
    }

    private static void copy(File from, OutputStream to) throws IOException {
        java.io.FileInputStream in = new java.io.FileInputStream(from);
        try {
            byte[] buf = new byte[64 * 1024];
            int n;
            while ((n = in.read(buf)) > 0) to.write(buf, 0, n);
        } finally { in.close(); }
    }

    /** Borra archivos temporales con más de un día. */
    private void cleanOldFiles() {
        File[] files = FilesProvider.dir(this).listFiles();
        if (files == null) return;
        long limit = System.currentTimeMillis() - 24L * 3600 * 1000;
        for (File f : files) if (f.lastModified() < limit) f.delete();
    }

    private static void writeFile(File f, byte[] bytes) throws IOException {
        FileOutputStream fos = new FileOutputStream(f);
        try { fos.write(bytes); } finally { fos.close(); }
    }

    private void toast(String msg) {
        Toast.makeText(this, msg, Toast.LENGTH_LONG).show();
    }

    private void jsToast(String msg) {
        web.evaluateJavascript("window.__toast && window.__toast(" + JSONObject.quote(msg) + ", 'ok')", null);
    }
}
