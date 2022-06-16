## Link Favicons

Plugin for [Obsidian](https://obsidian.md)

![GitHub package.json version](https://img.shields.io/github/package-json/v/joethei/obsidian-link-favicon)
![GitHub manifest.json dynamic (path)](https://img.shields.io/github/manifest-json/minAppVersion/joethei/obsidian-link-favicon?label=lowest%20supported%20app%20version)
![GitHub](https://img.shields.io/github/license/joethei/obsidian-link-favicon)
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)
---

With this plugin you can see the favicon for a linked website without using any custom CSS.

![Demo](https://i.joethei.space/Obsidian_Qe0GnS62Md.png)

Works with: [Admonition](https://github.com/valentine195/obsidian-admonition)
, [RSS Reader](https://github.com/joethei/obsidian-rss) and many more plugins.

Also check out [Link Favicons for Firefox & Chromium based browsers](https://github.com/joethei/browser-favicon-links)

## Icon Providers
You can select between these providers in the settings:

| Provider                                                           | Max Size  | Fallback                | max requests    |
|--------------------------------------------------------------------|-----------|-------------------------|-----------------|
| Google                                                             | 16x16px   | default icon            | no limit️       |
| DuckDuckGo                                                         | none      | default icon            | no limit        |
| [Favicon Grabber](https://favicongrabber.com/)                     | none      | none                    | 100 per minute  | 
| [The Favicon Finder](https://github.com/mat/besticon) (selfhosted) | 256x256px | automatically generated | no limit️       |
| [Icon Horse](https://icon.horse/)                                  | none      | automatically generated | fair use policy |
| [Splitbee](https://github.com/splitbee/favicon-resolver)           | none      | yes (from Google)       | unknown         |

Depending on which provider you choose the icons might look different.

The Icon Provider will only receive the hostname your links, so `forum.obsidian.md` instead
of `https://forum.obsidian.md/t/custom-link-favicons-hiding-in-community-plugins/24112/5?u=joethei`


## Overwriting icons
> Requires the [Icon Shortcodes](https://github.com/aidenlx/obsidian-icon-shortcodes) plugin

You can overwrite any domain favicon with an icon of your choosing in the settings.
(See the demo gif below)

## Defining Icons for URI Schemes
> Requires the [Icon Shortcodes](https://github.com/aidenlx/obsidian-icon-shortcodes) plugin

You can also add icons for uri schemes such as `mailto://`, `obsidian://` or `calculator://`.
To do this specify the name of the uri scheme(without `://`) in the settings.
(See the demo gif below)

![Custom icons demo](https://i.joethei.space/Obsidian_dtVoxv2Xbf.gif)

### For Designers
For help with styling you can also check out the `#appearance` channel on
the [Obsidian Members Group Discord](https://obsidian.md/community)

If you want to style the favicons you can use a CSS snippet similar to the one below, which makes all favicons appear in
grayscale.

```css
body .link-favicon[data-is-readable-a-a] {
	filter: grayscale(100%);
}
```

If you want to disable your own styling for favicons you can check if the `data-favicon` Attribute is "true". The
example below removes the external link
icon <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/External_link_font_awesome.svg/240px-External_link_font_awesome.svg.png" height="15px">
.

```css
.external-link[data-favicon="true"] {
	background-image: none;
}
```

#### Color Inversion

By default, icons that are perceived as unreadable will have a color filter applied to help with readability.
There are multiple metrics that could be used to decide if an icon is readable or not:
- `is-dark`, `is-light`: whether the icon's color perceived brightness is dark/light.
- `is-readable-a-a`: according to the [W3C AA specification](https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-contrast.html)
- `is-readable-a-a-a`: according to the [W3C AAA specification](https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast7.html)

By default, the AA value is used.

using the `is-dark`, `is-light` values is not recommended as they don't take the background color into account.

These values are calculated from the average color.
Using the most dominant color would be more accurate, but is not implemented currently.

### For Developers

As long as you use
the [renderMarkdown](https://marcus.se.net/obsidian-plugin-docs/api/classes/MarkdownRenderer#rendermarkdown)
Method this plugin will add favicons to your external links.
If you want no link favicons in your plugin either add `no-favicon` to your source path when calling the method.
Or specify the Attribute `data-no-favicon` on your link element.
