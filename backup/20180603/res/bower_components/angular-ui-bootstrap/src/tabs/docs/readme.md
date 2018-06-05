AngularJS version of the tabs directive.

### uib-tabset settings

* `justified`
  <small class="badge">$</small>
  _(Default: `false`)_ -
  Whether tabs fill the container and have a consistent width.

* `type`
  _(Defaults: `tabs`)_ -
  Navigation type. Possible values are 'tabs' and 'pills'.

* `vertical`
  <small class="badge">$</small>
  _(Default: `false`)_ -
  Whether tabs appear vertically stacked.

### uib-tab settings

* `active`
  <small class="badge">$</small>
  <i class="glyphicon glyphicon-eye-open"></i>
  _(Default: `false`)_ -
  Whether tab is currently selected.

* `deselect()`
  <small class="badge">$</small> -
  An optional expression called when tab is deactivated.

* `disable`
  <small class="badge">$</small>
  <i class="glyphicon glyphicon-eye-open"></i>
  _(Default: `false`)_ -
  Whether tab is clickable and can be activated.

* `heading` -
  Heading text.

* `select()`
  <small class="badge">$</small> -
  An optional expression called when tab is activated.

### Tabset heading

Instead of the `heading` attribute on the `uib-tabset`, you can use an `uib-tab-heading` element inside a tabset that will be used as the tabset's header. There you can use HTML as well.

### Known issues

To use clickable elements within the tab, you have override the tab template to use div elements instead of anchor elements, and replicate the desired styles from Bootstrap's CSS. This is due to browsers interpreting anchor elements as the target of any click event, which triggers routing when certain elements such as buttons are nested inside the anchor element.
