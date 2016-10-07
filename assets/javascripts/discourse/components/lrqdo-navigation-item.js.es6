import computed from "ember-addons/ember-computed-decorators";
import StringBuffer from 'discourse/mixins/string-buffer';

export default Ember.Component.extend(StringBuffer, {
  tagName: 'a',
  classNameBindings: [':nav-link', 'active', 'content.hasIcon:has-icon'],
  attributeBindings: ['title', 'href'],
  hidden: Em.computed.not('content.visible'),
  rerenderTriggers: ['content.count'],

  @computed("content.categoryName", "content.name")
  title(categoryName, name) {
    const extra = {};

    if (categoryName) {
      name = "category";
      extra.categoryName = categoryName;
    }

    return I18n.t("filters." + name.replace("/", ".") + ".help", extra);
  },

  @computed()
  href() {
    return this.get('content').get('href');
  },

  @computed("content.filterMode", "filterMode")
  active(contentFilterMode, filterMode) {
    return contentFilterMode === filterMode ||
           filterMode.indexOf(contentFilterMode) === 0;
  },

  renderString(buffer) {
    const content = this.get('content');
    buffer.push(this.get('content.displayName'));
  }
});
