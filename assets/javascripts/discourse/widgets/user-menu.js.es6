import { createWidget } from 'discourse/widgets/widget';
import { h } from 'virtual-dom';

export default createWidget('user-menu', {
  tagName: 'div.dropdown.open',

  panelContents() {
    const path = this.currentUser.get('path');

    return [this.attach('link', { className: 'dropdown-item',
                                 href: '',
                                 route: 'user',
                                 model: this.currentUser,
                                 contents: function() { return h('div.dropdown-item-content', [
                                              h('i.fa.fa-user'),
                                              h('span', ' ' + I18n.t('lrqdo.my_profile'))
                                            ]); }
                                }),
            this.attach('link', { className: 'dropdown-item',
                                 href: `${path}/messages`,
                                 contents: function() { return h('div.dropdown-item-content', [
                                              h('i.fa.fa-envelope-o'),
                                              h('span', ' ' + I18n.t('lrqdo.messages'))
                                            ]); }
                                }),
            this.attach('link', { className: 'dropdown-item',
                                 href: `${path}/preferences`,
                                 contents: function() { return h('div.dropdown-item-content', [
                                              h('i.fa.fa-gear'),
                                              h('span', ' ' + I18n.t('lrqdo.settings'))
                                            ]); }
                                }),
            this.attach('link', { action: 'logout',
                                 className: 'dropdown-item',
                                 href: '',
                                 contents: function() { return h('div.dropdown-item-content', [
                                              h('i.fa.fa-sign-out'),
                                              h('span', ' ' + I18n.t('lrqdo.sign_out'))
                                            ]); }
                                })
            ];
  },

  html() {
    return h('div.dropdown-menu.dropdown-menu-right', this.panelContents());
  },

  clickOutside() {
    this.sendWidgetAction('toggleUserMenu');
  }
});
