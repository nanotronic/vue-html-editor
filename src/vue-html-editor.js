/**
 * A HTML editor control based on the summernote plugin.
 *
 * @param model
 *    the model bind to the control, which must be a two way binding variable.
 * @param language
 *    the optional language code. Default value is "en-US".
 * @param height
 *    the optional height of the HTML editor. Default value is 160.
 * @param minHeight
 *    the optional minimum height of the HTML editor. Default value is 160.
 * @param maxHeight
 *    the optional maximum height of the HTML editor. Default value is 800.
 *    A null value indicates no limitation.
 * @param toolbar
 *    the optional configuration of toolbar buttons. Default value is
 *     [["font", ["bold", "italic", "underline", "clear"]],
 *      ["fontsize", ["fontsize"]],
 *      ["para", ["ul", "ol", "paragraph"]],
 *      ["color", ["color"]],
 *      ["insert", ["link", "picture", "hr"]]]
 * @author Haixing Hu
 */
module.exports = {
  replace: true,
  inherit: false,
  template: "<textarea class='form-control'></textarea>",
  props: {
    model: {
      required: true,
      twoWay: true
    },
    language: {
      type: String,
      required: false,
      default: 'en-US'
    },
    height: {
      type: Number,
      required: false,
      default: 160
    },
    minHeight: {
      type: Number,
      required: false,
      default: 160
    },
    maxHeight: {
      type: Number,
      required: false,
      default: 800
    },
    toolbar: {
      type: Array,
      required: false,
      default: function () {
        return [
          ['font', ['bold', 'italic', 'underline', 'clear']],
          ['fontsize', ['fontsize']],
          ['para', ['ul', 'ol', 'paragraph']],
          ['color', ['color']],
          ['insert', ['link', 'picture', 'hr']]
        ]
      }
    }
  },
  beforeCompile: function () {
    this.isChanging = false
    this.control = null
  },
  ready: function () {
    //  initialize the summernote
    if (this.minHeight > this.height) {
      this.minHeight = this.height
    }
    if (this.maxHeight < this.height) {
      this.maxHeight = this.height
    }
    var me = this
    this.control = $(this.$el)
    this.control.summernote({
      lang: this.language,
      height: this.height,
      minHeight: this.minHeight,
      maxHeight: this.maxHeight,
      toolbar: this.toolbar,
      onInit: function () {
        me.control.summernote('code', me.model)
      }
    }).on('summernote.change', function () {
      // Note that we do not use the "onChange" options of the summernote
      // constructor. Instead, we use a event handler of "summernote.change"
      // event because that I don't know how to trigger the "onChange" event
      // handler after changing the code of summernote via ".code()" function.
      if (!me.isChanging) {
        me.isChanging = true
        var code = me.control.summernote('code')
        me.model = (code === null || code.length === 0 ? null : code)
        me.$nextTick(function () {
          me.isChanging = false
        })
      }
    }).on('summernote.paste', function (e) {
      var updatePastedText = function (someNote) {
        var original = me.control.summernote('code')
        var cleaned = me.cleanPastedHTML(original)
        me.control.summernote('code', cleaned)
      }
      setTimeout(updatePastedText, 10)
    })
  },

  watch: {
    'model': function (val, oldVal) {
      if (!this.isChanging) {
        this.isChanging = true
        //  note that setting code value does not automatically trigger
        //  the "summernote.change" event
        var code = (val === null ? '' : val)
        this.control.summernote('code', code)
        this.isChanging = false
      }
    }
  },

  methods: {
    cleanPastedHTML (input) {
      // 1. remove line breaks / Mso classes
      var stringStripper = /(\n|\r| class=(")?Mso[a-zA-Z]+(")?)/g
      var output = input.replace(stringStripper, ' ')
      // 2. strip Word generated HTML comments
      var commentSripper = new RegExp('<!--(.*?)-->', 'g')
      var output = output.replace(commentSripper, '')
      var tagStripper = new RegExp('<(/)*(meta|link|span|\\?xml:|st1:|o:|font)(.*?)>', 'gi')
      // 3. remove tags leave content if any
      output = output.replace(tagStripper, '')
      // 4. Remove everything in between and including tags '<style(.)style(.)>'
      var badTags = ['style', 'script', 'applet', 'embed', 'noframes', 'noscript']

      for (var i = 0; i < badTags.length; i++) {
        tagStripper = new RegExp('<' + badTags[i] + '.*?' + badTags[i] + '(.*?)>', 'gi')
        output = output.replace(tagStripper, '')
      }
      // 5. remove attributes ' style="..."'
      var badAttributes = ['style', 'start']
      for (var i = 0; i < badAttributes.length; i++) {
        var attributeStripper = new RegExp(' ' + badAttributes[i] + '="(.*?)"', 'gi')
        output = output.replace(attributeStripper, '')
      }
      return output
    }
  }
}
