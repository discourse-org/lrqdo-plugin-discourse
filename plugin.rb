# name: lrqdo
# about: La ruche qui dit oui
# version: 0.1.1
# authors: Sébastien Bourdu
# url: https://github.com/ekkans/lrqdo-plugin-discourse

enabled_site_setting :lrqdo_enabled

register_asset 'stylesheets/theme-1476703501.css'
register_asset 'stylesheets/customization.scss'

after_initialize do

  Category.register_custom_field_type('list_thumbnails', :boolean)
  Category.register_custom_field_type('list_excerpts', :boolean)
  Topic.register_custom_field_type('thumbnails', :json)
  Topic.register_custom_field_type('author', :json)

  @nil_thumbs = TopicCustomField.where( name: 'thumbnails', value: nil )
  if @nil_thumbs.length
    @nil_thumbs.each do |thumb|
      hash = { :normal => '' }
      thumb.value = ::JSON.generate(hash)
      thumb.save!
    end
  end

  module ListHelper
    class << self
      def create_thumbnails(id, image, original_url)
        width = SiteSetting.topic_list_thumbnail_width
        height = SiteSetting.topic_list_thumbnail_height
        normal = image ? thumbnail_url(image, width, height) : original_url
        thumbnails = { normal: normal }
        Rails.logger.info "Saving thumbnails: #{thumbnails}"
        save_thumbnails(id, thumbnails)
        return thumbnails
      end

      def thumbnail_url (image, w, h)
        image.create_thumbnail!(w, h) if !image.has_thumbnail?(w, h)
        image.thumbnail(w, h).url
      end

      def save_thumbnails(id, thumbnails)
        return if !thumbnails
        topic = Topic.find(id)
        topic.custom_fields['thumbnails'] = thumbnails
        topic.save_custom_fields
      end
    end
  end

  require 'cooked_post_processor'
  class ::CookedPostProcessor

    def get_linked_image(url)
      max_size = SiteSetting.max_image_size_kb.kilobytes
      file = FileHelper.download(url, max_size, "discourse", true) rescue nil
      Rails.logger.info "Downloaded linked image: #{file}"
      image = file ? Upload.create_for(@post.user_id, file, file.path.split('/')[-1], File.size(file.path)) : nil
      image
    end

    def create_topic_thumbnails(url)
      local = UrlHelper.is_local(url)
      image = local ? Upload.find_by(sha1: url[/[a-z0-9]{40,}/i]) : get_linked_image(url)
      Rails.logger.info "Creating thumbnails with: #{image}"
      ListHelper.create_thumbnails(@post.topic.id, image, url)
    end

    def update_topic_image
      if @post.is_first_post?
        img = extract_images_for_topic.first
        Rails.logger.info "Updating topic image: #{img}"
        return if !img["src"]
        url = img["src"][0...255]
        @post.topic.update_column(:image_url, url)
        return if SiteSetting.topic_list_hotlink_thumbnails
        create_topic_thumbnails(url)
      end
    end

  end

  require 'topic_list_item_serializer'
  class ::TopicListItemSerializer
    attributes :thumbnails,
               :topic_post_id,
               :author

    def first_post_id
     first = Post.find_by(topic_id: object.id, post_number: 1)
     first ? first.id : false
    end

    def topic_post_id
      accepted_id = object.custom_fields["accepted_answer_post_id"].to_i
      return accepted_id > 0 ? accepted_id : first_post_id
    end
    alias :include_topic_post_id? :first_post_id

    def excerpt
      cooked = Post.where(id: topic_post_id).pluck('cooked')
      excerpt = PrettyText.excerpt(cooked[0], SiteSetting.topic_list_excerpt_length, keep_emoji_images: true)
      excerpt.gsub!(/(\[#{I18n.t 'excerpt_image'}\])/, "") if excerpt
      excerpt
    end

    def include_excerpt?
      object.excerpt.present?
    end

    def thumbnails
      return unless object.archetype == Archetype.default
      if SiteSetting.topic_list_hotlink_thumbnails
        thumbs = { normal: object.image_url }
      else
        thumbs = get_thumbnails || get_thumbnails_from_image_url
      end
      thumbs
    end

    def include_thumbnails?
      thumbnails.present? && (thumbnails[:normal].present? || thumbnails['normal'].present?)
    end

    def get_thumbnails
      thumbnails = object.custom_fields['thumbnails']
      if thumbnails.is_a?(String)
        thumbnails = ::JSON.parse(thumbnails)
      end
      if thumbnails.is_a?(Array)
        thumbnails = thumbnails[0]
      end
      thumbnails.is_a?(Hash) ? thumbnails : false
    end

    def get_thumbnails_from_image_url
      image = Upload.get_from_url(object.image_url) rescue false
      return ListHelper.create_thumbnails(object.id, image, object.image_url)
    end

    def topic_post
      Post.find(topic_post_id)
    end

    def author
      user = topic_post.user
      author = { name: user.name, title: user.title, username: user.username,
                 avatar_url: user.avatar_template_url.gsub("{size}", "45") }
      author
    end

    def include_author?
      true
    end

  end

  TopicList.preloaded_custom_fields << "accepted_answer_post_id" if TopicList.respond_to? :preloaded_custom_fields
  TopicList.preloaded_custom_fields << "thumbnails" if TopicList.respond_to? :preloaded_custom_fields
  TopicList.preloaded_custom_fields << "author" if TopicList.respond_to? :preloaded_custom_fields

  add_to_serializer(:basic_category, :list_excerpts) {object.custom_fields["list_excerpts"]}
  add_to_serializer(:basic_category, :list_thumbnails) {object.custom_fields["list_thumbnails"]}
end
