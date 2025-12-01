/*
	Multiverse by HTML5 UP — Enhanced EXIF-safe mobile support
	Rewritten to: - reliably read EXIF on mobile & cached images
	                - cache EXIF by data-name (unique) so poptrox clones work
	                - extract EXIF before hiding images / setting backgrounds
	                - preserve original features (breakpoints, panels, poptrox, etc.)
*/

(function ($) {
  "use strict";

  var $window = $(window),
    $body = $("body"),
    $wrapper = $("#wrapper");

  // Breakpoints.
  breakpoints({
    xlarge: ["1281px", "1680px"],
    large: ["981px", "1280px"],
    medium: ["737px", "980px"],
    small: ["481px", "736px"],
    xsmall: [null, "480px"],
  });

  // IE hack
  if (typeof browser !== "undefined" && browser.name == "ie")
    $body.addClass("ie");

  // Touch?
  if (typeof browser !== "undefined" && browser.mobile) $body.addClass("touch");

  // Transitions supported?
  if (typeof browser === "undefined" || browser.canUse("transition")) {
    $window.on("load", function () {
      window.setTimeout(function () {
        $body.removeClass("is-preload");
      }, 100);
    });

    var resizeTimeout;
    $window.on("resize", function () {
      window.clearTimeout(resizeTimeout);
      $body.addClass("is-resizing");
      resizeTimeout = window.setTimeout(function () {
        $body.removeClass("is-resizing");
      }, 100);
    });
  }

  // Scroll back to top.
  $window.scrollTop(0);

  // Panels.
  var $panels = $(".panel");

  $panels.each(function () {
    var $this = $(this),
      $toggles = $('[href="#' + $this.attr("id") + '"]'),
      $closer = $('<div class="closer" />').appendTo($this);

    // Closer.
    $closer.on("click", function (event) {
      $this.trigger("---hide");
    });

    // Events.
    $this
      .on("click", function (event) {
        event.stopPropagation();
      })
      .on("---toggle", function () {
        if ($this.hasClass("active")) $this.triggerHandler("---hide");
        else $this.triggerHandler("---show");
      })
      .on("---show", function () {
        if ($body.hasClass("content-active")) $panels.trigger("---hide");
        $this.addClass("active");
        $toggles.addClass("active");
        $body.addClass("content-active");
      })
      .on("---hide", function () {
        $this.removeClass("active");
        $toggles.removeClass("active");
        $body.removeClass("content-active");
      });

    // Toggles.
    $toggles
      .removeAttr("href")
      .css("cursor", "pointer")
      .on("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        $this.trigger("---toggle");
      });
  });

  // Global events.
  $body.on("click", function (event) {
    if ($body.hasClass("content-active")) {
      event.preventDefault();
      event.stopPropagation();
      $panels.trigger("---hide");
    }
  });

  $window.on("keyup", function (event) {
    if (event.keyCode == 27 && $body.hasClass("content-active")) {
      event.preventDefault();
      event.stopPropagation();
      $panels.trigger("---hide");
    }
  });

  // Header links
  var $header = $("#header");
  $header.find("a").each(function () {
    var $this = $(this),
      href = $this.attr("href");
    if (!href || href.charAt(0) == "#") return;
    $this
      .removeAttr("href")
      .css("cursor", "pointer")
      .on("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        window.location.href = href;
      });
  });

  // Footer copyright repositioning
  var $footer = $("#footer");
  $footer.find(".copyright").each(function () {
    var $this = $(this),
      $parent = $this.parent(),
      $lastParent = $parent.parent().children().last();

    breakpoints.on("<=medium", function () {
      $this.appendTo($lastParent);
    });

    breakpoints.on(">medium", function () {
      $this.appendTo($parent);
    });
  });

  // Main and EXIF handling
  var $main = $("#main");
  var exifDatas = {}; // cache keyed by data-name (user confirmed uniqueness)

  // Helper: get key for an <img> jQuery element. Prefer data-name, fallback to filename from src
  function getImageKey($img) {
    var key = $img.data("name");
    if (typeof key !== "undefined" && key !== null && key !== "")
      return key + "";
    // Fallback: extract filename from src
    var src = $img.attr("src") || "";
    return src.split("/").pop();
  }

  // Helper: read EXIF for a native DOM img element and cache it by key.
  // Ensures it runs immediately if the image is complete (cached) or after load.
  function ensureExifForImg(domImg, key) {
    if (!domImg || !key) return;

    try {
      // If we already have it, do nothing.
      if (typeof exifDatas[key] !== "undefined") return;

      // If image is already complete, read immediately.
      if (domImg.complete) {
        EXIF.getData(domImg, function () {
          exifDatas[key] = getExifDataMarkup(this);
        });
      } else {
        // Add a one-time load listener.
        var listener = function () {
          try {
            EXIF.getData(domImg, function () {
              exifDatas[key] = getExifDataMarkup(this);
            });
          } catch (e) {
            // swallow EXIF parsing errors so UI still works
            console.warn("EXIF parse error for", key, e);
          }
          domImg.removeEventListener("load", listener);
        };
        domImg.addEventListener("load", listener);
      }
    } catch (e) {
      console.warn("ensureExifForImg error", e);
    }
  }

  // Build EXIF markup using data from #main data('exif') mapping (preserves original behavior)
  function getExifDataMarkup(img) {
    try {
      var exifMap = $main.data("exif") || {};
      var template = "";
      for (var current in exifMap) {
        if (!exifMap.hasOwnProperty(current)) continue;
        var current_data = exifMap[current];
        var exif_data = EXIF.getTag(img, current_data["tag"]);
        if (typeof exif_data !== "undefined") {
          template +=
            '<i class="' +
            (current_data["icon"] || "") +
            '" aria-hidden="true"></i> ' +
            exif_data +
            "&nbsp;&nbsp;";
        }
      }
      return template;
    } catch (e) {
      console.warn("getExifDataMarkup error", e);
      return "";
    }
  }

  // Thumbs: set backgrounds, hide original img (but AFTER scheduling exif read)
  $main.children(".thumb").each(function () {
    var $this = $(this),
      $image = $this.find(".image"),
      $image_img = $image.children("img");

    if ($image.length === 0 || $image_img.length === 0) return;

    // Compute key
    var key = getImageKey($image_img);

    // Ensure EXIF read will be attempted immediately (works for cached images too)
    ensureExifForImg($image_img[0], key);

    // Set background from src (preserve original intent), then hide original img
    // We intentionally set background AFTER scheduling EXIF read to avoid some Safari issues.
    $image.css("background-image", "url(" + $image_img.attr("src") + ")");

    // If the <img> has data-position, use it
    var pos = $image_img.data("position");
    if (pos) $image.css("background-position", pos);

    // hide original img (keeps layout but uses background image visually)
    $image_img.hide();
  });

  // Poptrox init
  $main.poptrox({
    baseZIndex: 20000,
    caption: function ($a) {
      // $a is the <a> element that contains the <img>
      var $image_img = $a.children("img");

      // If there's no img here (poptrox may use a cloned image in its popup), try to find key by href
      var key = getImageKey($image_img.length ? $image_img : $a.find("img"));

      // If we already cached EXIF for this key, return it.
      if (typeof exifDatas[key] !== "undefined" && exifDatas[key]) {
        return "<p>" + exifDatas[key] + "</p>";
      }

      // Otherwise, try to trigger an EXIF read for the *original* image element in the DOM.
      // Find the original image in #main that has the same data-name or src filename.
      var $originalImg = $main
        .find("img")
        .filter(function () {
          return getImageKey($(this)) === key;
        })
        .first();

      if ($originalImg.length) {
        // Ensure read
        ensureExifForImg($originalImg[0], key);

        // If EXIF became available synchronously (because image.complete was true), return it.
        if (typeof exifDatas[key] !== "undefined" && exifDatas[key]) {
          return "<p>" + exifDatas[key] + "</p>";
        }
      }

      // Fallback: return an empty space so popup still displays; EXIF will be available for next open.
      return " ";
    },
    fadeSpeed: 300,
    onPopupClose: function () {
      $body.removeClass("modal-active");
    },
    onPopupOpen: function () {
      $body.addClass("modal-active");
    },
    overlayOpacity: 0,
    popupCloserText: "",
    popupHeight: 150,
    popupLoaderText: "",
    popupSpeed: 300,
    popupWidth: 150,
    selector: ".thumb > a.image",
    usePopupCaption: true,
    usePopupCloser: true,
    usePopupDefaultStyling: false,
    usePopupForceClose: true,
    usePopupLoader: true,
    usePopupNav: true,
    windowMargin: 50,
  });

  // Hack: Set margins to 0 when 'xsmall' activates.
  breakpoints.on("<=xsmall", function () {
    if ($main[0] && $main[0]._poptrox) $main[0]._poptrox.windowMargin = 0;
  });

  breakpoints.on(">xsmall", function () {
    if ($main[0] && $main[0]._poptrox) $main[0]._poptrox.windowMargin = 50;
  });
})(jQuery);
