<link rel="stylesheet" href="/0/00.css" />

# almost-zero-css

a **tiny class-less** collection of css styles for simple
responsive html pages.

it supports dark and light themes and comes in two sizes:

|                  |                                                                     | gzipped |
| ---------------- | ------------------------------------------------------------------- | ------: |
| [0.css](0.css)   | base: `a`, `h1`,`h2`, `p`, `ul`, `pre`, `code`, `img`, `table`, etc | 0.55 kb |
| [00.css](00.css) | plus `<form>` elements                                              | 1.24 kb |

---

feel free to copy. most likely no major
changes in your html required. check out some **examples**:

## image

<img alt="zero" width="480" height="480" src="/0/0.gif" />

<small>gif by [kevlavery](https://giphy.com/kevlavery)</small>

## code

<pre><code>
<kbd>&lt;kbd&gt; &mdash; for user input</kbd>
<q>&lt;q&gt; for copy-paste friendly</q>
<q>multiline blocks</q>
<var>&lt;var&gt; &mdash; variables</var>
<samp>&lt;samp&gt; &mdash; sample outputs</samp>
</code></pre>

## ascii pseudographics

```
┌─┬┐  ╔═╦╗  ╓─╥╖  ╒═╤╕
│ ││  ║ ║║  ║ ║║  │ ││
├─┼┤  ╠═╬╣  ╟─╫╢  ╞═╪╡
└─┴┘  ╚═╩╝  ╙─╨╜  ╘═╧╛
```

## link

- [visited](/0)
- [not visited](/-)
- <small>[small](#)</small>

## paragraph

- `code`
- _italic_
- **bold**
- ~strike~

lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
incididunt ut labore et dolore magna aliqua. ut enim ad minim veniam, quis
nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.

> lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
> tempor incididunt ut labore et dolore magna aliqua. ut enim ad minim.

<small>lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. ut enim ad minim veniam,
quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
consequat. duis aute irure dolor in reprehenderit in voluptate velit esse
cillum dolore eu fugiat nulla pariatur. excepteur sint occaecat cupidatat
non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</small>

## form

<form>
  <label for="text">label for text</label>
  <input id="text" type="text" value="text" />
  <label for="file">label for file</label>
  <input id="file" type="file" />
  <input type="submit" value="submit input" />
  <label for="select">label for select</label>
  <select id="select">
    <option>html</option>
    <option selected>css</option>
    <option>javascript</option>
  </select>
  <p>
    <label>label for radio</label>
    <label><input type="radio" name="radio" checked />radio 1</label>
    <label><input type="radio" name="radio" />radio 2</label>
    <label><input type="radio" name="radio" />radio 3</label>
  </p>
  <label for="date">date</label>
  <input id="date" type="date" />
  <label for="email">e-mail</label>
  <input id="email" type="email" placeholder="webmaster@example.com" autocomplete="email" />
  <label for="phone">phone</label>
  <input id="phone" type="tel" placeholder="555 1234" />
  <label for="color">color</label>
  <input id="color" type="color" value="#000000" />
  <label for="password">password</label>
  <input id="password" type="password" placeholder="***" autocomplete="current-password" />
  <label for="textarea">textarea</label>
  <textarea id="textarea"></textarea>
  <label><input type="checkbox" checked />checkbox label</label><br />
  <button type="submit">submit</button>
  <button type="reset" disabled="">reset</button>
</form>
