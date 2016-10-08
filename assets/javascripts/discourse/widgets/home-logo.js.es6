import Ember from 'ember';
import { createWidget } from 'discourse/widgets/widget';
import { wantsNewWindow } from 'discourse/lib/intercept-click';
import { h } from 'virtual-dom';

export default createWidget('home-logo', {
  tagName: 'div.col-lg-2.hidden-md-down',

  html() {
    return h('div', [
        h('a.navbar-brand', { href: "/" }, [
          h('img', { src: "http://laruchequiditoui-templates.sebastienbourdu.com/images/logo-e3ef2e8d.png", alt: "Site logo"}),
          h('span', 'Le forum')
        ]),
        h('p.navbar-text', h('a', { href: "#" }, [h('i.fa.fa-chevron-left'), ' Retour']))
    ]);
  },

  click(e) {
    if (wantsNewWindow(e)) { return false; }
    e.preventDefault();

    DiscourseURL.routeToTag($(e.target).closest('a')[0]);
    return false;
  }
});
