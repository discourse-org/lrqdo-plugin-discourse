import { withPluginApi } from 'discourse/lib/plugin-api';

export default {
  name: 'lrqdo',
  initialize(){

    withPluginApi('0.1', api => {

      const searchInput = "header form[role=search] input";

      $(document).on('focusin', searchInput, function() {
        return $('header > .navbar').addClass('navbar-search-focus');
      });
      $(document).on('focusout', searchInput, function() {
        return $('header > .navbar').removeClass('navbar-search-focus');
      });

      $(document).on('click', '.navbar-toggler', function() {
        return $('#collapsingNavbar').toggleClass('in');
      });


      api.onPageChange((url) => {

        $('header').addClass('d-header');

        if (url.substring(0, 3) === '/t/') {
          $('html').addClass('page-post');
        } else {
          $('html').removeClass('page-post');
        }

        const $ul = $('aside .list-unstyled');
        if($ul.find('li').length > 5) {
          const $seeMore = $ul.find('~ a');
          $seeMore.removeClass('invisible');
          $seeMore.click(function() {
            $seeMore.addClass('invisible');
            $ul.addClass('list-expanded');
          })
        }

      });
    })
  }
}
