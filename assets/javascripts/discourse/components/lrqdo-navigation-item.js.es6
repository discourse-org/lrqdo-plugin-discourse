import computed from "ember-addons/ember-computed-decorators";
import StringBuffer from 'discourse/mixins/string-buffer';
import DiscourseURL from 'discourse/lib/url';

export default Ember.Component.extend(StringBuffer, {
  tagName: 'a',
  classNameBindings: [':nav-link', 'active', 'content.hasIcon:has-icon'],
  attributeBindings: ['title', 'href'],
  hidden: Em.computed.not('content.visible'),
  rerenderTriggers: ['content.count'],
  href: Em.computed.alias('content.href'),

  @computed("content.categoryName", "content.name")
  title(categoryName, name) {
    const extra = {};

    if (categoryName) {
      name = "category";
      extra.categoryName = categoryName;
    }

    return I18n.t("filters." + name.replace("/", ".") + ".help", extra);
  },

  @computed("content.filterMode", "filterMode")
  active(contentFilterMode, filterMode) {
    return contentFilterMode === filterMode ||
           filterMode.indexOf(contentFilterMode) === 0;
  },

  renderString(buffer) {
    const content = this.get('content');
    buffer.push(this.get('content.displayName'));
  },

  click(e) {
    e.preventDefault();
    DiscourseURL.routeTo(this.get('href'));
    return true;
  }
});
