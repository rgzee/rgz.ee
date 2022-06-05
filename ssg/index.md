# static site generator

44 kb node.js app to generate static websites

<pre>
$ <kbd>npm install -g @rgzee/ssg</kbd>
$
</pre>

build website from `./src` into `./dst` directory

<pre>
$ <kbd>ssg src dst</kbd>
$
</pre>

contents of `src`

```
src            make dir ─▶  dst
├─.git           ignore     │
├─s            make dir ─▶  ├─s
│ ├─index.md      parse ─▶  │ ├─index.html
│ ├─s.css          copy ─▶  │ ├─s.css
│ └─ys.gif         copy ─▶  │ └─ys.gif
├─favicon.ico      copy ─▶  ├─favicon.ico
├─index.html *     copy ─▶  ├─index.html
├─license.html    parse ─▶  └─license.html
├─.ssg.json      ignore
└─.ssg.html      ignore
```

\* &mdash; `about.html` contains `<html>` tag

## what ssg does

copies directory tree from `src` to `dst` and skips ignored directories

it converts markdown files to html, generate web pages with a template, and copies the rest as it is from `src` to `dst` directory.

```
┏━━━━━━━━━━┓ marked *
┃ src/x.md ┠───┐
┗━━━━━━━━━━┛   │  ┌────────────┐
               └─▶│ tmp/x.html │
┏━━━━━━━━━━━━┓ ┏━▶└────────────┘
┃ src/x.html ┣━┛
┗━━━━━━━━━━━━┛ copy
```

\* &mdash; when both `x.html` and `x.md` are present, html version
overrides markdown one

copies as it is if file contains `<html>` tag

```
has <html> tag
┌────────────┐ copy  ┏━━━━━━━┓
│ tmp/x.html ├──────▶┃ dst/x ┃
└────────────┘       ┗━━━━━━━┛
```

finds first `<h1>`, `<p>`, and `<img>` tags

then replaces placeholders

- <kbd>&#123;{title}}</kbd> with contents of `<h1>`
- <kbd>&#123;{description}}</kbd> with contents of `<p>` as
- <kbd>&#123;{image}}</kbd> with `src` of `<img>`
- <kbd>&#123;{content}}</kbd> with content of the file

<pre><code>
no &lt;html&gt; tag
┌────────────┐
│ tmp/y.html │
└─┬──────────┘
  │ extract content from tags and
  │ replace placeholders with it
  │
  │ &lt;h1&gt;...&lt;/h1&gt;    ─▶ &#123;{title}}
  │ &lt;p&gt;...&lt;/p&gt;      ─▶ &#123;{description}}
  │ &lt;img src="..."&gt; ─▶ &#123;{image}}
  │
  │ parsed file     ─▶ &#123;{content}}
  │
┌─┴──────────┐ wrap  ┏━━━━━━━┓
│ +.ssg.html ├──────▶┃ dst/y ┃
└────────────┘       ┗━━━━━━━┛
</code></pre>

src/.ssg.html

<pre><code>
&lt;meta name="og:description" content="&#123;{description}}" /&gt;
&lt;meta name="og:image" content="&#123;{image}}" /&gt;
&lt;title&gt;&#123;{title}}&lt;/title&gt;
&#123;{content}}
</code></pre>

src/index.md

```
# static site generator

it generates static websites

![ssg](ssg.jpg)
```

dst/index.html

```
<meta name="og:description" content="it generates static websites" />
<meta name="og:image" content="https://rgz.ee/ssg.jpg" />
<title>static site generator</title>
<h1>static site generator</h1>

<p>it generates static websites</p>

<img alt="ssg" src="ssg.jpg" />

```


ignores file paths listed in `ignore` property of `.ssg.json` and
copies the rest of the files to `dst/` directory, then generates
`dst/sitemap.xml`

```
      ignore listed
       in .ssg.json,
┌───────┐ copy rest ┏━━━━━━━┓
│ src/* ├──────────▶┃ dst/* ┃
└───────┘           ┗━━━━━━━┛

generate sitemap for
all pages ┏━━━━━━━━━━━━━━━━━┓
╾────────▶┃ dst/sitemap.xml ┃
          ┗━━━━━━━━━━━━━━━━━┛
```
