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
    private byte[] pendingPdf;
    private String pendingPdfName;

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
            if (granted && pendingPdf != null) savePdfNow(pendingPdf, pendingPdfName);
            else toast("Se necesita permiso de almacenamiento para guardar el PDF");
            pendingPdf = null;
            pendingPdfName = null;
        }
    }

    // ---------------------------------------------------------------- PDF
    private class Bridge {
        @JavascriptInterface
        public void savePdf(String base64, final String fileName) {
            final byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
            runOnUiThread(new Runnable() {
                @Override public void run() {
                    if (Build.VERSION.SDK_INT < 29
                            && checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                        pendingPdf = bytes;
                        pendingPdfName = fileName;
                        requestPermissions(new String[] { Manifest.permission.WRITE_EXTERNAL_STORAGE }, REQ_PERM_STORAGE);
                    } else {
                        savePdfNow(bytes, fileName);
                    }
                }
            });
        }
    }

    private void savePdfNow(byte[] bytes, String name) {
        Uri viewUri;
        try {
            if (Build.VERSION.SDK_INT >= 29) {
                ContentValues v = new ContentValues();
                v.put("_display_name", name);
                v.put("mime_type", "application/pdf");
                v.put("relative_path", Environment.DIRECTORY_DOWNLOADS);
                viewUri = getContentResolver().insert(Uri.parse("content://media/external/downloads"), v);
                if (viewUri == null) throw new IOException("insert");
                OutputStream os = getContentResolver().openOutputStream(viewUri);
                os.write(bytes);
                os.close();
            } else {
                File dl = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                dl.mkdirs();
                writeFile(new File(dl, name), bytes);
                File copy = new File(FilesProvider.dir(this), name);
                writeFile(copy, bytes);
                viewUri = FilesProvider.uriFor(copy);
            }
        } catch (Exception e) {
            toast("No se pudo guardar el PDF");
            return;
        }
        jsToast("PDF guardado en Descargas: " + name);
        try {
            Intent i = new Intent(Intent.ACTION_VIEW);
            i.setDataAndType(viewUri, "application/pdf");
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(Intent.createChooser(i, "Abrir PDF"));
        } catch (Exception ignored) { /* sin visor de PDF: queda en Descargas */ }
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
