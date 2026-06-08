import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-static";

/**
 * Lightweight tracking script served at /script.js.
 * Usage: <script src="https://YOUR_DOMAIN/script.js" data-project-id="PROJECT_ID" defer></script>
 *
 * Design goals: tiny payload, no blocking work, no third-party cookies,
 * resilient to SPA route changes (patches pushState/replaceState).
 *
 * Named "script.js" / "/api/collect" (not "tracker.js" / "/api/track") because
 * ad-blockers (Brave Shields, uBlock + EasyPrivacy, Safari ITP) pattern-match
 * "tracker"/"track" in URLs and silently drop the request.
 */
const SCRIPT = `(function () {
  try {
    // document.currentScript is null for scripts injected dynamically (e.g. next/script,
    // GTM, async loaders) — fall back to locating our own <script data-project-id> tag.
    var script = document.currentScript;
    if (!script || !script.getAttribute("data-project-id")) {
      var candidates = document.querySelectorAll("script[data-project-id]");
      for (var i = 0; i < candidates.length; i++) {
        if (/\/script\.js(\?|$)/.test(candidates[i].src)) {
          script = candidates[i];
          break;
        }
      }
    }
    if (!script) return;
    var projectId = script.getAttribute("data-project-id");
    if (!projectId) return;

    var endpoint = new URL("/api/collect", script.src).toString();
    var STORAGE_VISITOR = "sp_visitor_id";
    var STORAGE_SESSION = "sp_session_id";
    var STORAGE_SESSION_TS = "sp_session_ts";
    var SESSION_IDLE_MS = 30 * 60 * 1000;

    function uid() {
      return Math.random().toString(36).slice(2) + Date.now().toString(36);
    }

    function getVisitorId() {
      try {
        var id = localStorage.getItem(STORAGE_VISITOR);
        if (!id) {
          id = uid();
          localStorage.setItem(STORAGE_VISITOR, id);
        }
        return id;
      } catch (e) {
        return uid();
      }
    }

    function getSessionId() {
      try {
        var now = Date.now();
        var last = parseInt(sessionStorage.getItem(STORAGE_SESSION_TS) || "0", 10);
        var id = sessionStorage.getItem(STORAGE_SESSION);
        if (!id || now - last > SESSION_IDLE_MS) {
          id = uid();
          sessionStorage.setItem(STORAGE_SESSION, id);
        }
        sessionStorage.setItem(STORAGE_SESSION_TS, String(now));
        return id;
      } catch (e) {
        return uid();
      }
    }

    var visitorId = getVisitorId();

    function send(payload) {
      var body = JSON.stringify(payload);
      try {
        if (navigator.sendBeacon) {
          var blob = new Blob([body], { type: "application/json" });
          navigator.sendBeacon(endpoint, blob);
          return;
        }
      } catch (e) {}
      try {
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: body,
          keepalive: true,
        }).catch(function () {});
      } catch (e) {}
    }

    function trackPageview() {
      send({
        projectId: projectId,
        visitorId: visitorId,
        sessionId: getSessionId(),
        type: "pageview",
        path: location.pathname + location.search,
        referrer: document.referrer || null,
      });
    }

    function trackEvent(name, metadata) {
      if (!name) return;
      send({
        projectId: projectId,
        visitorId: visitorId,
        sessionId: getSessionId(),
        type: "event",
        name: String(name).slice(0, 120),
        metadata: metadata && typeof metadata === "object" ? metadata : undefined,
      });
    }

    // Patch SPA navigation so route changes count as page views.
    var rawPushState = history.pushState;
    var rawReplaceState = history.replaceState;
    function wrap(fn) {
      return function () {
        var result = fn.apply(this, arguments);
        trackPageview();
        return result;
      };
    }
    history.pushState = wrap(rawPushState);
    history.replaceState = wrap(rawReplaceState);
    window.addEventListener("popstate", trackPageview);

    window.statspilot = window.statspilot || {};
    window.statspilot.track = trackEvent;

    trackPageview();
  } catch (e) {}
})();
`;

export async function GET() {
  return new NextResponse(SCRIPT, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
