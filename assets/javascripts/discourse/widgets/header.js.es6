import { createWidget } from 'discourse/widgets/widget';
import { iconNode } from 'discourse-common/lib/icon-library';
import { avatarImg } from 'discourse/widgets/post';
import DiscourseURL from 'discourse/lib/url';
import { wantsNewWindow } from 'discourse/lib/intercept-click';
import { applySearchAutocomplete } from "discourse/lib/search";
import { ajax } from 'discourse/lib/ajax';
import { h } from 'virtual-dom';
import Composer from 'discourse/models/composer';
import { translateSize, avatarUrl } from 'discourse/lib/utilities';

const dropdown = {
  buildClasses(attrs) {
    if (attrs.active) { return "active"; }
  },

  click(e) {
    if (wantsNewWindow(e)) { return; }
    e.preventDefault();
    if (!this.attrs.active) {
      this.sendWidgetAction(this.attrs.action);
    }
  }
};

createWidget('header-notifications', {

  html(attrs) {
    const { user } = attrs;

    const unreadNotifications = user.get('unread_notifications');
    let notifications;
    if (!!unreadNotifications) {
      notifications = this.attach('link', {
        action: attrs.action,
        className: 'badge-notification unread-notifications',
        rawLabel: unreadNotifications,
        omitSpan: true
      });
    }

    const contents = h("div.nav-link", [
      h("i.fa.fa-bell-o"),
      h("span.hidden-lg-down", " " + I18n.t("lrqdo.notifications")),
      notifications
    ]);

    return contents;
  }
});

createWidget('notifications-dropdown', jQuery.extend({
  tagName: 'li.nav-item',

  buildId() {
    return 'current-user';
  },

  html(attrs) {
    return h('a', { attributes: { href: '', 'data-auto-route': true } },
             this.attach('header-notifications', attrs));
  }
}, dropdown));

createWidget('user-dropdown', jQuery.extend({
  tagName: 'li.nav-item',

  buildId() {
    return 'current-user';
  },

  html(attrs) {
    return h('a', { attributes: { href: attrs.user.get('path'), 'data-auto-route': true } },
             this.attach('header-user', attrs));
  }
}, dropdown));

createWidget('header-user', {
  settings: {
    avatarSize: 'large'
  },

  html(attrs) {
    const { currentUser } = this;

    let avatar;
    const size = translateSize(this.settings.avatarSize);
    const url = avatarUrl(currentUser.get('avatar_template'), size);
    if (url || url.length > 0) {
      const title = currentUser.get('username');
      const properties = {
        attributes: { alt: '', width: size, height: size, src: Discourse.getURLWithCDN(url), title },
        className: 'img-circle'
      };
      avatar = h('img', properties);
    }
    const contents = [avatar];

    return contents;
  }
});

createWidget('header-dropdown', jQuery.extend({
  tagName: 'li.header-dropdown-toggle',

  html(attrs) {
    const title = I18n.t(attrs.title);

    const body = [iconNode(attrs.icon)];
    if (attrs.contents) {
      body.push(attrs.contents.call(this));
    }

    return h(
      'a.icon.btn-flat',
      { attributes: {
        href: attrs.href,
          'data-auto-route': true,
          title,
          'aria-label': title,
          id: attrs.iconId
        }
      },
      body
    );
  }
}, dropdown));

const button = {
  buildClasses(attrs) {
    if (attrs.active) { return "active"; }
  },

  click(e) {
    if (wantsNewWindow(e)) { return; }
    e.preventDefault();
    if (!this.attrs.active) {
      this.sendWidgetAction(this.attrs.action);
    }
  }
};

createWidget('header-button', jQuery.extend({
  tagName: 'li.nav-item',

  html(attrs) {

    const body = [];
    if (attrs.contents) {
      body.push(attrs.contents.call(this));
    }

    return h('button.btn.btn-primary', body);
  }
}, button));

createWidget('header-icons', {
  tagName: 'ul.nav.navbar-nav.pull-lg-right',

  buildAttributes() {
    return { role: 'navigation' };
  },

  html(attrs) {
    if (this.siteSettings.login_required && !this.currentUser) { return []; }

    const createTopic = this.attach('header-button', {
                     action: 'createTopic',
                     contents() { return I18n.t("lrqdo.create_a_subject"); }
                   });

    const hamburger = this.attach('header-dropdown', {
                        title: 'hamburger_menu',
                        icon: 'bars',
                        iconId: 'toggle-hamburger-menu',
                        active: attrs.hamburgerVisible,
                        action: 'toggleHamburger',
                        contents() {
                          if (!attrs.flagCount) { return; }
                          return h('div.badge-notification.flagged-posts', { attributes: {
                            title: I18n.t('notifications.total_flagged')
                          } }, attrs.flagCount);
                        }
                      });

    const search = this.attach('header-dropdown', {
                     title: 'search.title',
                     icon: 'search',
                     iconId: 'search-button',
                     action: 'toggleSearchMenu',
                     active: attrs.searchVisible,
                     href: Discourse.getURL('/search')
                   });

    const icons = [];
    if (attrs.user) {
      icons.push(createTopic);
      icons.push(this.attach('notifications-dropdown', {
        active: attrs.notificationsVisible,
        action: 'toggleNotificationsMenu',
        ringBackdrop: attrs.ringBackdrop,
        user: attrs.user
      }));
      icons.push(this.attach('user-dropdown', {
        active: attrs.userVisible,
        action: 'toggleUserMenu',
        ringBackdrop: attrs.ringBackdrop,
        user: attrs.user
      }));
    }

    return icons;
  },
});

createWidget('header-buttons', {
  tagName: 'span',

  html(attrs) {
    if (this.currentUser) { return; }

    const buttons = [];

    if (attrs.canSignUp && !attrs.topic) {
      buttons.push(this.attach('button', { label: "sign_up",
                                           className: 'btn btn-primary',
                                           action: "showCreateAccount" }));
    }


    buttons.push(this.attach('button', { label: 'log_in',
                                         className: 'btn btn-primary',
                                         action: 'showLogin',
                                         icon: 'user' }));

    /* Little trick for the search mode */
    buttons.push(h('li.nav-item', ''));

    return h('ul.nav.navbar-nav.pull-lg-right', buttons);
  }
});

const forceContextEnabled = ['category', 'user', 'private_messages'];

let additionalPanels = [];
export function attachAdditionalPanel(name, toggle, transformAttrs) {
  additionalPanels.push({ name, toggle, transformAttrs });
}

export default createWidget('header', {
  tagName: 'header.d-headerr',
  buildKey: () => `header`,

  defaultState() {
    let states =  {
      searchVisible: false,
      hamburgerVisible: false,
      notificationsVisible: false,
      userVisible: false,
      ringBackdrop: true
    };

    if (this.site.mobileView) {
      states.skipSearchContext = true;
    }

    return states;
  },

  html(attrs, state) {

    const panels = [
      this.attach('header-buttons', attrs),
      this.attach('header-icons', {
        hamburgerVisible: state.hamburgerVisible,
        notificationsVisible: state.notificationsVisible,
        userVisible: state.userVisible,
        searchVisible: state.searchVisible,
        ringBackdrop: state.ringBackdrop,
        flagCount: attrs.flagCount,
        user: this.currentUser }
      )
    ];

    if (state.searchVisible) {
      const contextType = this.searchContextType();

      if (state.searchContextType !== contextType) {
        state.contextEnabled = undefined;
        state.searchContextType = contextType;
      }

      if (state.contextEnabled === undefined) {
        if (forceContextEnabled.includes(contextType)) {
          state.contextEnabled = true;
        }
      }

      panels.push(this.attach('search-menu', { contextEnabled: state.contextEnabled }));
    } else if (state.hamburgerVisible) {
      panels.push(this.attach('hamburger-menu'));
    } else if (state.notificationsVisible) {
      panels.push(this.attach('notifications-menu'));
    } else if (state.userVisible) {
      panels.push(this.attach('user-menu'));
    }

    additionalPanels.map((panel) => {
      if (this.state[panel.toggle]) {
        panels.push(this.attach(panel.name, panel.transformAttrs.call(this, attrs, state)));
      }
    });

    const search = this.attach('header-search');

    const contents = [ this.attach('home-logo', { minimized: !!attrs.topic }),
                       h('div.col-md-5.col-lg-4', search),
                       h('div.col-md-5.col-lg-4', panels) ];

    if (attrs.topic) {
      contents.push(this.attach('header-topic-info', attrs));
    }

    return h('nav.navbar.navbar-fixed-top', [
      h("div.navbar-mobile", [ h("a.navbar-brand.hidden-lg-up", {"attributes":{"href":"/"}},
        [ h("img", {"attributes":{"src":"/plugins/lrqdo/images/logo-white.svg", "width":"44px", "height":"42px"}}, [ "Le forum" ]) ]),
        h("button.pull-right.navbar-toggler.hidden-lg-up",
        {"attributes":{"aria-controls":"collapsingNavbar","aria-expanded":"false","aria-label":"Toggle navigation","type":"button"},
        "dataset":{"target":"#collapsingNavbar","toggle":"collapse"}}, [ "☰" ]) ]),
      h('#collapsingNavbar.navbar-toggleable-md.collapse',
        h('div.container-fluid',
          h('div.row', contents)
        )
      )
    ]);
  },

  updateHighlight() {
    if (!this.state.searchVisible) {
      const service = this.register.lookup('search-service:main');
      service.set('highlightTerm', '');
    }
  },

  closeAll() {
    this.state.userVisible = false;
    this.state.hamburgerVisible = false;
    this.state.searchVisible = false;
  },

  linkClickedEvent(attrs) {

    let searchContextEnabled = false;
    if (attrs) {
      searchContextEnabled = attrs.searchContextEnabled;

      const { searchLogId, searchResultId, searchResultType } = attrs;
      if (searchLogId && searchResultId && searchResultType) {

        ajax('/search/click', {
          type: 'POST',
          data: {
            search_log_id: searchLogId,
            search_result_id: searchResultId,
            search_result_type: searchResultType
          }
        });
      }
    }

    if (!searchContextEnabled) {
      this.closeAll();
    }

    this.updateHighlight();
  },

  toggleSearchMenu() {
    if (this.site.mobileView) {
      const searchService = this.register.lookup('search-service:main');
      const context = searchService.get('searchContext');
      var params = "";

      if (context) {
        params = `?context=${context.type}&context_id=${context.id}&skip_context=${this.state.skipSearchContext}`;
      }

      return DiscourseURL.routeTo('/search' + params);
    }

    this.state.searchVisible = !this.state.searchVisible;
    this.updateHighlight();

    if (this.state.searchVisible) {
      Ember.run.schedule('afterRender', () => {
        const $searchInput = $('#search-term');
        $searchInput.focus().select();

        applySearchAutocomplete($searchInput, this.siteSettings, this.appEvents, {
          appendSelector: '.menu-panel'
        });
      });
    }
  },

  toggleUserMenu() {
    if (this.currentUser.get('read_first_notification')) {
      this.state.ringBackdrop = false;
    };

    this.state.userVisible = !this.state.userVisible;
  },

  toggleHamburger() {
    this.state.hamburgerVisible = !this.state.hamburgerVisible;
  },

  togglePageSearch() {
    const { state } = this;

    state.contextEnabled = false;

    const currentPath = this.register.lookup('controller:application').get('currentPath');
    const blacklist = [ /^discovery\.categories/ ];
    const whitelist = [ /^topic\./ ];
    const check = function(regex) { return !!currentPath.match(regex); };
    let showSearch = whitelist.any(check) && !blacklist.any(check);

    // If we're viewing a topic, only intercept search if there are cloaked posts
    if (showSearch && currentPath.match(/^topic\./)) {
      const controller = this.register.lookup('controller:topic');
      const total = controller.get('model.postStream.stream.length') || 0;
      const chunkSize = controller.get('model.chunk_size') || 0;

      showSearch = (total > chunkSize) &&
        $('.topic-post .cooked, .small-action:not(.time-gap)').length < total;
    }

    if (state.searchVisible) {
      this.toggleSearchMenu();
      return showSearch;
    }

    if (showSearch) {
      state.contextEnabled = true;
      this.toggleSearchMenu();
      return false;
    }

    return true;
  },

  toggleNotificationsMenu() {
    this.state.notificationsVisible = !this.state.notificationsVisible;
  },

  createTopic() {
    this.register.lookup('controller:composer').open({
      action: Composer.CREATE_TOPIC,
      draftKey: Composer.CREATE_TOPIC,
      categoryId: $('[data-composer-category-id]').data('composer-category-id')
     });
  },

  searchMenuContextChanged(value) {
    this.state.contextType = this.register.lookup('search-service:main').get('contextType');
    this.state.contextEnabled = value;
  },

  domClean() {
    const { state } = this;

    if (state.searchVisible || state.hamburgerVisible || state.userVisible) {
      this.closeAll();
    }
  },

  headerKeyboardTrigger(msg) {
    switch(msg.type) {
      case 'search':
        this.toggleSearchMenu();
        break;
      case 'user':
        this.toggleUserMenu();
        break;
      case 'hamburger':
        this.toggleHamburger();
        break;
      case 'page-search':
        if (!this.togglePageSearch()) {
          msg.event.preventDefault();
          msg.event.stopPropagation();
        }
        break;
    }
  },

  searchContextType() {
    const service = this.register.lookup('search-service:main');
    if (service) {
      const ctx = service.get('searchContext');
      if (ctx) {
        return Ember.get(ctx, 'type');
      }
    }
  }

});
