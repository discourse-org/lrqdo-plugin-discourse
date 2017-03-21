import { createWidget } from 'discourse/widgets/widget';
import { h } from 'virtual-dom';

createWidget('header-search-term', {
  tagName: 'form',
  buildId: () => 'header-search-term',
  buildAttributes(attrs) {
    return { role: 'search', onsubmit: 'return false;' };
  },

  html(attrs) {
    const searchInput = "header form[role=search] input";

    let attributes =  { type: 'text',
       value: attrs.value || '',
       placeholder: attrs.contextEnabled ? "" : I18n.t("lrqdo.search"),
       class: attrs.loading ? 'input-searching' : ''};

    return h('div.input-group', [
      h('div.input-group-btn.input-group-btn-inside.input-group-btn-inside-lg', h('i.fa.fa-search')),
      h('input.form-control.form-control-lg.form-control-with-icon-left.form-control-with-icon-left-lg', attributes)
    ]);
  },

  keyUp(e) {
    if (e.which === 13) {
      this.sendWidgetAction('fullSearch');
    }

    const val = this.attrs.value;
    const newVal = $(`#${this.buildId()} input`).val();

    if (newVal !== val) {
      this.sendWidgetAction('searchTermChanged', newVal);
    }
  },

  click() {
    this.sendWidgetAction('toggleResults', true);
  }
});
