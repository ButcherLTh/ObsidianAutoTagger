Hi,

With the help of Claudi Haiku 4.5 I changed the basis of the sample-plugin provided by Obsidian.md to a working autotagger.
Since this is my first coding project. I commented on every line, to explain it to myself. 

Whenever you define a new tag, the plugin scrapes your vault for any matching words (regardless of lower or upper case) and tags them as well. 
Whenever you write a word, which previously was tagged (maybe on an older file) it gets automatically tagged.

By using the command line, you are able to manually trigger a vault-wide search for any untagged words, to tag them. Command: "autotagger: Scan all files and tag them"

Feel free to optimize this repo. If you have any questions, it is likely, that I do not have the knowledge to answer them, but feel free to ask nonetheless - I will get back to you either way!
