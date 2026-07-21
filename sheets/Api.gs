/**
 * Mcfly API client — shared contract with Shopify app (@mcfly/api-contract).
 */
var McflyApi = (function () {
  function getConfig_() {
    var props = PropertiesService.getScriptProperties();
    var apiBase = props.getProperty("MCFLY_API_BASE");
    var apiToken = props.getProperty("MCFLY_API_TOKEN");
    var shopId = props.getProperty("MCFLY_SHOP_ID");
    if (!apiBase || !apiToken) {
      throw new Error(
        "Set Script Properties: MCFLY_API_BASE, MCFLY_API_TOKEN (optional MCFLY_SHOP_ID).",
      );
    }
    return {
      apiBase: apiBase.replace(/\/$/, ""),
      apiToken: apiToken,
      shopId: shopId,
    };
  }

  function request_(path, options) {
    options = options || {};
    var config = getConfig_();
    var url = config.apiBase + path;
    var headers = {
      Authorization: "Bearer " + config.apiToken,
      Accept: "application/json",
    };
    if (config.shopId) {
      headers["X-Mcfly-Shop-Id"] = config.shopId;
    }
    if (options.headers) {
      Object.keys(options.headers).forEach(function (k) {
        headers[k] = options.headers[k];
      });
    }

    var response = UrlFetchApp.fetch(url, {
      method: options.method || "get",
      headers: headers,
      contentType: options.contentType || "application/json",
      payload: options.payload ? JSON.stringify(options.payload) : undefined,
      muteHttpExceptions: true,
    });

    var code = response.getResponseCode();
    var text = response.getContentText();
    if (code < 200 || code >= 300) {
      throw new Error("Mcfly API " + code + ": " + text);
    }
    return JSON.parse(text);
  }

  return {
    getMer: function (from, to, includeAllocation) {
      var q =
        "/mer?from=" +
        encodeURIComponent(from) +
        "&to=" +
        encodeURIComponent(to) +
        "&includeAllocation=" +
        (includeAllocation !== false);
      return request_(q);
    },

    getAllocation: function (from, to) {
      return request_(
        "/allocation?from=" +
          encodeURIComponent(from) +
          "&to=" +
          encodeURIComponent(to),
      );
    },

    postSpend: function (entries) {
      return request_("/spend", {
        method: "post",
        payload: { entries: entries },
      });
    },
  };
})();
