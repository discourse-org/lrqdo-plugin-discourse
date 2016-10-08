import { createWidget } from 'discourse/widgets/widget';
import { h } from 'virtual-dom';

createWidget('header-search-term', {
  tagName: 'div.input-group',
  buildId: () => 'header-search-term',

  html(attrs) {
    let attributes =  { type: 'text',
       value: attrs.value || '',
       placeholder: attrs.contextEnabled ? "" : "Rechercher",
       class: attrs.loading ? 'input-searching' : ''};

    return [
      h('div.input-group-btn.input-group-btn-inside.input-group-btn-inside-lg', h('i.fa.fa-search')),
      h('input.form-control.form-control-lg.form-control-with-icon-left.form-control-with-icon-left-lg', attributes)
    ];
  },

  keyUp(e) {
    if (e.which === 13) {
      return this.sendWidgetAction('fullSearch');
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
