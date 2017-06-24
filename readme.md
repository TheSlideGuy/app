## Format of songs


The following text format will be parsed into a JSON tree.

```
# All Lines starting with a '#' will not show up on the audience screen, 
# but will show up in presenter screen

---
# Header of song here, enclosed in triple hyphens
"Here I am to worship" music and lyrics by Tim Hughes
Copyright 2003 Tim Hughes
CCLI #123456
---

# Slide 1 - Verse 1
Light of the world 
You stepped down into darkness 
Opened my eyes let me see 


This will be text for slide 2.
# Each slide is separated by a blank line


# Headers are optional; you can have a blank header to denote a new song,
# but without song header. This allows you to hide the song header for the next song, if you enabled the option of showing the header on every slide of the song

---
---

New song slide
```


### JSON tree
To simplify the syntax tree format, single new lines within a block of text will be untouched, and it's up to app display to present it as `<li>` items, etc.

```
[
    {
        header: {text: "Here..." music and lyrics by Tim Hughes 2003..."}},
        slides: [
            { text: "Light of the world\nYou stepped down into darkness..."
                , notes: "Slide 1 - Verse 1" },
            { text: "Beauty that made..."}
        ]
    }
    {
        //headers are optional
        slides: [
            { text: "Light of the world\nYou stepped down into darkness..."
                , notes: "Slide 1 - Verse 1" },
            { text: "Beauty that made..."}
        ]
    }
]
```