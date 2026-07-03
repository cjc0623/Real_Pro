import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:url_launcher/url_launcher.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FirstRoad',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
      ),
      home: const WebViewPage(url: 'https://firstroad.duckdns.org/'),
    );
  }
}

/// 소셜 로그인(구글·네이버·카카오·애플) OAuth 도메인.
/// 이 도메인들은 임베디드 WebView 로그인을 차단하는 경우가 많아 외부 브라우저로 연다.
const List<String> _socialLoginHosts = [
  'accounts.google.com',
  'nid.naver.com',
  'kauth.kakao.com',
  'accounts.kakao.com',
  'appleid.apple.com',
];

bool _isSocialLoginUrl(Uri? uri) {
  if (uri == null) return false;
  final host = uri.host.toLowerCase();
  return _socialLoginHosts.any((h) => host == h || host.endsWith('.$h'));
}

class WebViewPage extends StatefulWidget {
  /// 첫 화면은 [url]로 로드한다. 팝업(새 창)으로 열릴 때는 [windowId]만 전달받아
  /// 부모 WebView가 넘겨준 창을 그대로 표시한다.
  final String? url;
  final int? windowId;

  const WebViewPage({super.key, this.url, this.windowId});

  bool get isPopup => windowId != null;

  @override
  State<WebViewPage> createState() => _WebViewPageState();
}

class _WebViewPageState extends State<WebViewPage> {
  bool _isLoading = true;

  final InAppWebViewSettings _settings = InAppWebViewSettings(
    javaScriptEnabled: true,
    javaScriptCanOpenWindowsAutomatically: true,
    supportMultipleWindows: true, // 팝업(새 창) 허용
    useShouldOverrideUrlLoading: true,
  );

  Future<void> _openExternally(Uri uri) async {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final webView = InAppWebView(
      windowId: widget.windowId,
      initialUrlRequest:
          widget.url != null ? URLRequest(url: WebUri(widget.url!)) : null,
      initialSettings: _settings,
      onLoadStart: (controller, url) => setState(() => _isLoading = true),
      onLoadStop: (controller, url) => setState(() => _isLoading = false),
      // 링크/리다이렉트를 가로챈다. 소셜 로그인은 외부 브라우저로 넘긴다.
      shouldOverrideUrlLoading: (controller, navigationAction) async {
        final uri = navigationAction.request.url;
        if (_isSocialLoginUrl(uri?.uriValue)) {
          // 팝업 안에서 소셜 URL로 이동한 경우, 빈 팝업 창은 닫는다.
          final navigator = widget.isPopup ? Navigator.of(context) : null;
          await _openExternally(uri!.uriValue);
          if (navigator != null && mounted && navigator.canPop()) {
            navigator.pop();
          }
          return NavigationActionPolicy.CANCEL;
        }
        return NavigationActionPolicy.ALLOW;
      },
      // 사이트가 window.open() / target="_blank" 로 새 창을 열면 여기로 들어온다.
      onCreateWindow: (controller, createWindowAction) async {
        final targetUrl = createWindowAction.request.url;
        // 소셜 로그인 창은 새 창을 만들지 않고 곧바로 외부 브라우저로 연다.
        if (_isSocialLoginUrl(targetUrl?.uriValue)) {
          await _openExternally(targetUrl!.uriValue);
          return false;
        }
        // 그 외 팝업(우편번호·본인인증 등)은 앱 안 새 창에서 열어 opener 통신을 유지한다.
        if (!mounted) return false;
        await Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => WebViewPage(windowId: createWindowAction.windowId),
          ),
        );
        return true;
      },
      // 팝업이 스스로 window.close() 를 호출하면(인증 완료 등) 라우트를 닫는다.
      onCloseWindow: (controller) {
        if (widget.isPopup && Navigator.of(context).canPop()) {
          Navigator.of(context).pop();
        }
      },
    );

    return Scaffold(
      // 팝업 창은 사용자가 직접 닫을 수 있도록 상단 바를 둔다.
      appBar: widget.isPopup
          ? AppBar(
              leading: IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.of(context).maybePop(),
              ),
            )
          : null,
      body: SafeArea(
        child: Stack(
          children: [
            webView,
            if (_isLoading) const Center(child: CircularProgressIndicator()),
          ],
        ),
      ),
    );
  }
}
