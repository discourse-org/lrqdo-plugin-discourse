import { registerUnbound } from 'discourse-common/lib/helpers';

registerUnbound('topic-link-path', function(topic) {
  var url = topic.linked_post_number ? topic.urlForPostNumber(topic.linked_post_number) : topic.get('lastUnreadUrl');
  return new Handlebars.SafeString(url);
});
