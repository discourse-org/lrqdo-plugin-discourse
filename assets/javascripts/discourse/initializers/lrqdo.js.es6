import { withPluginApi } from 'discourse/lib/plugin-api';

export default {
  name: 'lrqdo',
  initialize(){

    withPluginApi('0.1', api => {

      const searchInput = "header form[role=search] input";

      $(document).on('focusin', searchInput, function() {
        setTimeout(function() {
          $('header > .navbar').addClass('navbar-search-focus');
          $('header .twitter-typeahead').show();
        }, 100);
      });
      $(document).on('focusout', searchInput, function() {
        setTimeout(function() {
          $('header > .navbar').removeClass('navbar-search-focus');
          $('header .twitter-typeahead').hide();
        }, 300);
      });

      $(document).on('click', '.navbar-toggler', function() {
        $('#collapsingNavbar').toggleClass('in');
      });


      api.onPageChange((url) => {

        $('header').addClass('d-header');

        const $unread = $("a[href='/unread']");
        if ($unread.length > 0) {
          if ($unread.text().split('(').length > 1) {
            $unread.addClass('active-unread');
          }
        }

        if (url.substring(0, 3) === '/t/') {
          $('html').addClass('page-post');
          if (url.substr(url.length - 5) === '/last') {
            $(document).on('DOMNodeInserted', '.post-stream', function () {
              $('#topic-footer-main-buttons button.create').trigger('click');
              $(document).off('DOMNodeInserted', '.post-stream');
            });
          }
        } else {
          $('html').removeClass('page-post');
        }

        const $ul = $('aside .list-unstyled');
        if($ul.find('li').length > 5) {
          const $seeMore = $ul.find('~ a');
          $seeMore.removeClass('invisible');
        }

      });
    })
  }
}
