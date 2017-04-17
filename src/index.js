/**
 * @author {娄露红}({WB085725})
 * @version 0.0.1
 */
define(function(require) { // eslint-disable-line no-unused-vars
  // localStorage
  function getLS(key) {
    var ls = window.localStorage;
    if (ls) {
      return ls.getItem(key) ? ls.getItem(key) : 0;
    } else {
      return null;
    }
  }
  function setLS(key, value) {
    var ls = window.localStorage;
    try {
      ls.setItem(key, value);
    } catch(e) {

    }
  }
  function clearLS() {
    var ls = window.localStorage;
    try {
      localStorage.clear();
    } catch(e) {

    }
  }

  // 翻页节流控制
  var throttle = false;
  var lazy = require('kg/km-lazyload');
  var mtop = require('kg/km-mtop');
  var itemTpl = require('./item.jst.html');
  var windvane = require('mtb/lib-windvane');
  
  function Mod() {
    this.init.apply(this, arguments);
  }

  Mod.prototype = {
  /**
  * 入口
  * @param dom 模块根节点
  * @param conf 数据描述，为空说明已渲染
  */
  init: function(container, conf) {
    var self = this;
    self._node = $(container);
    // 禁止下拉刷新
    $('head').append('')
    // 初始化参数
    self.hisOffset = getLS('christ_offset') ? getLS('christ_offset') : 0;
    self.pageSize = 70;
    self.livepageNum = 1;
    
    // 绑定事件
    self.bindEvt();

    // 初始化请求数据
    self.dataMtop(self.hisOffset, self.pageSize, self.livepageNum, 'append', function(value, livemore) {
      // 回调更新缓存数据
      setLS('christ_offset', value);
      // 更新直播
      if (livemore === '1') {
        self.livepageNum = self.livepageNum + 1;
      } else {
        self.livepageNum = 0;
      }
      // eggs
      self.addeggs();
      // 开始执行popupdate
      self.popupdate();
    }, 'showall');
    
  },
  addeggs: function() {
    var self = this;
    self.eggsarray = self._node.find('.eggs');
    self.eggacting = {};
    self.eggsarray.forEach(function(v, i){
      var offset = Math.floor($(v).parents('li').offset().top);
      self.eggacting[offset] = $(v);
    });
  },
  eggaction: function() {
    var self = this;
    var base = $(window).height();
    var offsets = Math.ceil($(window).scrollTop()) - 200; // buffer
    self.eggsarray.removeClass('active');
    for (var i in self.eggacting) {
      if (i > offsets && i < base + offsets) {
        self.eggacting[i].addClass('active');
      }
    }
  },
  popupdate: function() {
    var self = this;
    // 每个30秒提示更新
    self._node.find('.btn-rotate').removeClass('rotates');
    self._node.find('.list-updatemore').hide().removeClass('flashing');
    setTimeout(function(){
      self._node.find('.list-updatemore').show().addClass('flashing');
    }, 30000);
  },
  bindEvt: function() {
    var self = this;
    $('.list-updatemore').on('click', function(e) {
       self._node.find('.btn-rotate').addClass('rotates');
      // 点击的更新 - 查看更多10条
      self.pageSize = 10;
      // 请求数据
      self.dataMtop(getLS('christ_offset'), self.pageSize, self.livepageNum, 'insert', function(value, livemore) {
        // 隐藏更新
        self.popupdate();
        // 回调更新缓存数据
        setLS('christ_offset', value);
        // 更新直播
        if (livemore === '1') {
          self.livepageNum = self.livepageNum + 1;
        } else {
          self.livepageNum = 0;
        }
        // 彩蛋
        self.addeggs();
        // 回滚至顶部
        window.scrollTo(0, 0);
      })
    });
    // 滚屏事件
    $(window).on('scroll', function() {
      self.eggaction();
    });
    // 代理点击事件
    $(document).on('click', function(e) {
      ele = e.target ? e.target : e.srcElement;
      var $ele = $(ele);
      // 圣诞老人卡
      if ($ele.hasClass('christ-profile-raffle')) {
        var uid = $ele.parent('a.by_bottom_link').attr('data-link');
        var spmA = $('meta[name="spm-id"]').attr('content') || 0;
        var spmB = $('body').attr('data-spm') || 0;
        var spmC = 'dsanta';
        var spmString = spmA + '.' + spmB + '.' + spmC + '.1';
        $(document).trigger('christ:show', ['https://h5.m.taobao.com/global/buyer_index/index.html?userId=' + uid + '&spm=' + spmString
        ]);
      }

      // 头像
      if ($ele.parents('a').hasClass('taglink')) {
        // 强制我要开webview
        var url = 'https:' + $ele.parents('a').attr('href');
        var params = {
          url: url
        };
        if (windvane && String(windvane.isAvailable) !== 'false') {
          windvane.call('WVNative', 'openWindow', params, function(e) {
          }, function(e) {
            location.href = url;
          });
          return false;
        }
      }
    });

    // 判断是否应该有翻页逻辑
    if (self.hisOffset !== 0) {
      // 初始化时浏览记录不为0
      var tmp = function() {
      　　var scrollTop = $(window).scrollTop();
      　　var docHeight = $(document).height(); 
         var viewHeight = $(window).height();
         if (scrollTop + viewHeight >= docHeight - 300) {
           if (self.hisOffset <= 0) {
              $(window).off('scroll', tmp);
              self._node.find('.list-hismore').hide();
           } else {
              // his
              self._node.find('.list-hismore').show();
              // 翻页查看历史 - 10条数据
              self.pageSize = -10;
              // 请求数据
              if (throttle === false) {
                 throttle = true;
                 self.dataMtop(self.hisOffset, self.pageSize, self.livepageNum, 'append', function(value, livemore) {
                  // 更新历史offset
                  self.hisOffset = value;
                  // 更新直播
                  if (livemore === '1') {
                    self.livepageNum = self.livepageNum + 1;
                  } else {
                    self.livepageNum = 0;
                  }
                  throttle = false;
                  // 彩蛋
                  self.addeggs();
                });
              }
           }　
         }
      };
      $(window).scroll(tmp);
    }
  },
  dataMtop: function(offset, pageSize, livepageNum, direction, cbs, ext){
    var self=this;
    var cbs = (typeof cbs === 'function') ? cbs : function() {};
    var direction = direction ? direction : 'append';
    var showall = ext ? true : false;
    
    mtop.H5Request({
      api: "mtop.taobao.need.graphql.gate",
      v: "1.0",
      data: {
        paramMap: JSON.stringify({
          offset: offset, 
          pageSize: pageSize,
          livePageNum: livepageNum,
          showAll: showall
        }),
        graphqlQuery:'christmas_main_meeting_place_query'
      },
      ecode: "0",
      type: 'get', // 默认get
      dataType: 'jsonp', // 默认jsonp
      timeout: 20000 // 接口超时设置，默认为20000ms
    },
    function (resJson, retType) {
      console.log(resJson)
      var data = resJson.data;

      if (data.result && data.result.length === 0) {
        // 全部看完了
        clearLS();
        self._node.find('.list-hismore').hide();
      }

      if (direction === 'append') {
        // 直接append
        self._node.find('.item_ul').append(itemTpl({
          data: data
        }));
      } else {
        // 向上插入
        self._node.find('.item_ul').prepend(itemTpl({
          data: data
        }));
      }

      // 图片懒加载
      self._node.find('img').lazyload({
        autoWebp:true,
        offsetY: 100
      });

      cbs(data.offsetUpdate, String(data.liveHasMore));
    },
    function (resJson, retType) {
      console.log(resJson,'数据错误');
    });
    }
  };

  return Mod;

});
