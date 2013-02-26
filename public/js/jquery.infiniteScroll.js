//
// A jQuery plugin that fetches more data when the content is scrolled to the bottom.
//
// Parameters
//
// fetchDataUrl: 
//  Type: string
//  The HTTP POST URL from which to fetch more data.
//  The POST request data will contain;
//    rowIndex - the zero based index of next row to fetch
//    the optional user defined filters (see getFilters) as key/value pairs
//    eg. { rowIndex : 0, filter1 : 'value1', filter2 : 'value2' }
//
// getFilters: 
//  Type: Function()
//  A javascript function that returns an array of filter objects.  Each filter object must
//  have properties "key" and "value".
//
// appendData:
//  Type: Function(data)
//  A javascript function that will be called to append the fetched data.  This function will have a
//  single parameter that contains the raw data returned from the fetchDataUrl.
//
// options:
//  rowSelector: 
//    Type: string
//    A jQuery selector used to locate the existing content.
//  startFetchThresholdRows:
//    Type: number
//    Minimum number of rows below the scrollable view area before triggering
//    a call to fetch more rows.  If specified startFetchThresholdPx will be ignored.
//  startFetchThresholdPx:
//    Type: number
//    Minimum length in pixels of un-scrolled rows below the scrollable view area
//    before triggering a call to fetch more rows.
//  scrollViewport:
//    Type: string or element
//    A jquery selector or DOM element specifying the scrollable view port, if null
//    the window will be used.
//  clearData: 
//    Type: Function()
//    A function to be called automatically by the scroller to clear existing rows when
//    resetInfiniteScroll is called.
//
//
// Returns
//  An object with properties;
//    matchedSet:
//      The matched set.
//    resetInfiniteScroll:
//      Type: Function()
//      Call this function to force the scroller to begin fetching data from row index 0.  Generally
//      usefull if the filters have changed. Note this will call clearData if this function was
//      supplied in options.
//

(function ($) {
  $.fn.infiniteScroll = function (fetchDataUrl, getFilters, appendData, options) {

    options = $.extend({
      rowSelector: 'tbody tr',
      startFetchThresholdRows: null,
      startFetchThresholdPx: 1000,
      scrollViewport: null,
      clearData: null
    }, options || {});

    var isFetching = false;
    var reset = false;
    var $content = this.first();

    var $viewport;
    var viewportPadding = 0;
    var viewportBorder = 0;

    if (options.scrollViewport) {
      $viewport = $(options.scrollViewport);
      viewportPadding = parseInt($content.css('padding-top').replace('px', ''), 10);
      viewportBorder = parseInt($content.css('border-top-width').replace('px', ''), 10);
    }
    else {
      $viewport = $(window);
    }

    // Convert the array of filters into an object.  This allows for a nicer interface on the server.
    function filtersAsObject() {
      var i;
      var filters = getFilters();
      var converted = {};
      for (i = 0; i < filters.length; i++) {
        var f = filters[i];
        converted[f.key] = f.value;
      }

      return converted;
    }
    
    // Computes if we need more data, if we do it calls updateDisplay specifying
    // the current row.
    function scroll() {

      if (isFetching) return;

      var lengthBelowviewportPx = calcPixelsBelow();
      var $rows = $content.find(options.rowSelector);

      if (options.startFetchThresholdRows) {
        var rowsBelow = calcRowsBelow($rows, lengthBelowviewportPx);
        if (rowsBelow <= options.startFetchThresholdRows) {
          updateDisplay($rows.length);
        }
      }
      else {
        if (lengthBelowviewportPx <= options.startFetchThresholdPx) {
          updateDisplay($rows.length);
        }
      }
    }

    // Calculate number of pixels below the viewport.
    function calcPixelsBelow() {

      var viewPortTop;
      if ($viewport[0] === window) {
        viewPortTop = $viewport.scrollTop();
      }
      else {
        viewPortTop = $viewport.offset().top + viewportPadding + viewportBorder;
      }

      var contentHeight = $content.outerHeight(true);
      var viewPortHeight = $viewport.height();

      //offset().top does not include the margin
      var contentMargin = parseInt($content.css('margin-top').replace('px', ''), 10);
      var lengthAboveviewportPx = viewPortTop - $content.offset().top - contentMargin;
      var lengthBelowviewportPx = contentHeight - viewPortHeight - lengthAboveviewportPx;

      return lengthBelowviewportPx;
    }

    // Calculate number of rows below the viewport.
    function calcRowsBelow($rows, lengthBelowviewportPx) {

      var rowsBelow = 0;
      var rowsBelowPx = 0;

      $($rows.get().reverse()).each(function () {
        rowsBelowPx += $(this).outerHeight(true);
        if (rowsBelowPx > lengthBelowviewportPx) return; // break out of loop
        rowsBelow++;
      });

      return rowsBelow;
    }

    // Update display function.
    function updateDisplay(rowIndex) {
      if (isFetching) {
        // can only get here if we were called by resetInfiniteScroll
        reset = true;
      }
      else {
        isFetching = true;
        var data = $.extend({ rowIndex: rowIndex }, filtersAsObject());
        fetch(data);
      }
    }

    // Fetch more rows.
    function fetch(data) {
      $.ajax({
        type: 'POST',
        url: fetchDataUrl,
        contentType: 'application/json',
        data: JSON.stringify(data)
      }).done(function(data) {
        if (reset === false) {
          if (data.length > 0) {
            $.proxy(appendData(data), $content);
          }
          isFetching = false;
        }
        else {
          // filters have changed, data is out of date
          reset = false;
          fetch($.extend({ rowIndex: 0 }, filtersAsObject()));
        }
      }).fail(function(jqXHR, textStatus, errorThrown) {
        console.log('infinite scroll failed to fetch data');
        console.log(textStatus);
        isFetching = false;
      });
    }

    // Hook scrolling event on the viewport.
    if (options.scrollViewport) {
      $(options.scrollViewport).scroll(scroll);
    }
    else {
      $(window).scroll(scroll);
    }

    return {
      matchedSet: this,
      resetInfiniteScroll: function () {
        if (options.clearData)
          options.clearData();
        updateDisplay(0);
      }
    };

  };

})(jQuery);
