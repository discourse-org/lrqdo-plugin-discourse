import computed from "ember-addons/ember-computed-decorators";
import Composer from 'discourse/models/composer';

export default Ember.Component.extend({

  @computed()
  categories() {
    return Discourse.Category.list();
  },

  @computed()
  canCreateTopic() {
    return this.currentUser;
  },

  actions: {
    createTopic() {
      this.container.lookup('controller:composer').open({
        action: Composer.CREATE_TOPIC,
        draftKey: Composer.CREATE_TOPIC
       });
    }
  }

});
