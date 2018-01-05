$.when( $.ready ).then(function() {
  var getParam = function(key) {
    return new URLSearchParams(window.location.search).get(key);
  }
  var setParam = function(hash, isReplacing) {
    var baseUrl = [window.location.origin, window.location.pathname].join('');
    var params = new URLSearchParams(window.location.search);

    Object.keys(hash).forEach(function(key) {
      if (params.has(key)) {
        params.set(key, hash[key]);
      } else {
        params.append(key, hash[key]);
      }
    });
    
    if (!isReplacing) {
      window.history.pushState({}, document.title, baseUrl + '?' + params.toString());
    } else {
      window.history.replaceState({}, document.title, baseUrl + '?' + params.toString());
    }
  }
  function getTime(lastime) {
    var minute = 1000 * 60;
    var hour = minute * 60;
    var day = hour * 24;
    var halfamonth = day * 15;
    var month = day * 30;
    var now = new Date().getTime();
    var lasttime = (new Date(lastime)).getTime();
    var diffValue = now - lasttime;
    var dayC = diffValue / day;
    var hourC = diffValue / hour;
    var minC = diffValue / minute;
    if(dayC > 3) {
      result = [lastime.getFullYear(), lastime.getMonth() + 1, lastime.getDay()].join('-');
    } else if(dayC >= 1) {
      result = parseInt(dayC) + "天前";
    } else if(hourC >= 1) {
      result = parseInt(hourC) + "小时前";
    } else if(minC >= 1) {
      result = parseInt(minC) + "分钟前";
    } else if(minC < 1 && minC >= 0) {
      result = "刚刚";
    } else {
      result = "";
    }
    return result;
  }
  var loadMore = function() {
    if ($(window).scrollTop() >= $(document).height() - $(window).height()) {
      console.log($(window).scrollTop());
      console.log('Bottom!');

      setParam({page: parseInt(getParam('page')) + 1}, true);
      renderList(false);
    }
  }
  var joinNewsAndAds = function(news, ads) {
    ads.forEach(function(item) {
      item.isAd = true;
    });
    var list = ads.concat(news);
    list.sort(function() {
      return 0.5 - Math.random();
    });

    return list;
  }
  var getListDom = function(list) {
    var newDom = $();
    list.forEach(function(item) {
      var li = $('<li>').data('link', item.ldp).data('clickTrack', item.click_track);
      li.append($('<h5>').text(item.title));

      if (item.isAd) {
        li.append($('<p>').text(item.desc).addClass('desc'));
      }

      var images = $('<div>').addClass('images');
      if (!Array.isArray(item.img) || item.img.length == 1) {
        li.addClass('image-1');
        images.append($('<img>').attr('src', Array.isArray(item.img) ? item.img[0] : item.img));
      } else {
        li.addClass('image-3');
        item.img.forEach(function(url) {
          images.append($('<img>').attr('src', url));
        });
      }
      li.append(images);

      if (!item.isAd) {
        $('<div>').addClass('more-info')
            .append($('<span>').addClass('source').text(item.source))
            .append($('<span>').addClass('time').text(getTime(item.time)))
            .appendTo(li);
      }

      if (item.isAd) {
        li.addClass('isAd');
      }

      newDom = newDom.add(li);
    });
    return newDom;
  };
  var renderList = function(isRefreshing) {
    $.post('http://180.76.183.3/union', {
      tab: getParam('tab'),
      page: getParam('page'),
      appid: getParam('appid'),
      adspotid: getParam('adspotid'),
      req_params: getParam('req_params'),
    }, function(data) {
      if (isRefreshing) {
        $('ul.content').empty();
      }
      var list = joinNewsAndAds(data.content.news, data.content.ads);
      $('ul.content').append(getListDom(list));
      loadMore();
    });
  };
  var activateTab = function(tab) {
    if (tab) {
      setParam({ tab: tab, page: 1 });
    }
    $('.nav>li>.nav-link').removeClass('active');
    $('.nav>li#nav_item_' + getParam('tab') + '>.nav-link').addClass('active');
    renderList(true);
  }

  $(window).scroll(loadMore);
  $(window).on('popstate', function(event) {
    setParam({ page: 1 }, true);
    window.location.reload();
  });
  $('.content').on('click', 'li', function(event) {
    var target = $(event.currentTarget);
    if (target.data('clickTrack')) {
      target.data('clickTrack').forEach(function(url) {
        new Image().src = url;
      });
      window.setTimeout(function() {
        window.location.href = target.data('link');
      }, 1200);
    }
  });
  $('.nav').on('click', '.nav-item > :not(.active)', function(event) {
    activateTab(event.target.parentNode.id.substr(9));
  });

  var initPage = function() {
    $('.nav').css('width', $('.nav > li').length * 66);
    if (getParam('tab')) {
      activateTab();
      if (!getParam('page')) {
        setParam({ page: 1 }, true);
      }
    } else {
      setParam({ tab: 1001, page: 1 }, true);
    }
    renderList(true);
  };

  initPage();
});
