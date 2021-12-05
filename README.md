## Link Favicons
Plugin for [Obsidian](https://obsidian.md)

![GitHub package.json version](https://img.shields.io/github/package-json/v/joethei/obsidian-link-favicon)
![GitHub manifest.json dynamic (path)](https://img.shields.io/github/manifest-json/minAppVersion/joethei/obsidian-link-favicon?label=lowest%20supported%20app%20version)
![GitHub](https://img.shields.io/github/license/joethei/obsidian-link-favicon)
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)
---

With this plugin you can see the favicon for a linked website without using any custom CSS.

![Demo](https://i.joethei.space/Obsidian_Qe0GnS62Md.png)


You can select between these providers in the settings:
- Google
- DuckDuckGo
- [Favicon Grabber](https://favicongrabber.com/)
- [The Favicon Finder](https://github.com/mat/besticon) (selfhosted)
- [Icon Horse](https://icon.horse/)
- [Splitbee](https://github.com/splitbee/favicon-resolver)

Depending on wich one you choose the icons might look different.
The Icon Provider will only receive the hostname of the links you specify,
so `forum.obsidian.md` instead of `https://forum.obsidian.md/t/custom-link-favicons-hiding-in-community-plugins/24112/5?u=joethei`

Works with: [Admonition](https://github.com/valentine195/obsidian-admonition), [RSS Reader](https://github.com/joethei/obsidian-rss) and many more plugins.


Also check out [Link Favicons for Firefox & Chromium based browsers](https://github.com/joethei/browser-favicon-links)


### For Designers
If you want to style the favicons you can use a CSS snippet similar to the one below,
which makes all favicons appear in grayscale.
```css
img.link-favicon {
	filter: grayscale(100%);
}
```

If you want to disable your own styling for favicons you can check if the `data-favicon` Attribute is "true".
The example below removes the external link icon <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/External_link_font_awesome.svg/240px-External_link_font_awesome.svg.png" height="15px">.
```css
.external-link[data-favicon="true"] {
  background-image: none;
}
```

For help with styling you can also check out the `#appearance` channel on the [Obsidian Members Group Discord](https://obsidian.md/community)

### For Developers
As long as you use the [renderMarkdown](https://marcus.se.net/obsidian-plugin-docs/api/classes/MarkdownRenderer#rendermarkdown)
 Method this plugin will add favicons to your external links.
You can specify the Attribute `data-no-favicon` if you wan't your link to be ignored.
