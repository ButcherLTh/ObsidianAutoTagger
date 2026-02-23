import { App, Editor, Plugin, TFile } from 'obsidian';

export default class AutoTagWords extends Plugin { //  export means this class can be imported in other files, default means it's the main export of this file. There needs to be a main export of this file
 
	tags: string[] = []; // Here we will store all the tags we find in the vault. We will populate this array when the plugin loads and whenever there are changes in the vault. The tags are stored as strings. [] defines an array. string[] means it's an array of strings. We will use this array to check if a word in the editor matches any of the tags we have found in the vault. If it does, we will convert that word into a tag by adding a # in front of it.
	timeout: NodeJS.Timeout | null = null; // This is a variable to store a timeout. We will use this to delay the conversion of words to tags while the user is typing. This way we don't convert words to tags on every keystroke, which could be very inefficient. Instead, we will wait until the user has stopped typing for a short period of time (800 milliseconds) before we perform the conversion. If the user types again before the timeout is reached, we will clear the previous timeout and start a new one. This ensures that we only convert words to tags when the user has finished typing.
 // nodeJs.timeout is a type that represents the return value of the setTimeout function. It is used to store the identifier of the timeout so that we can clear it later if needed. The | null means that this variable can either be a NodeJS.Timeout or null. We initialize it to null because when the plugin first loads, there is no active timeout. 
	async onload() { // async means this function can perform asynchronous operations, such as reading files or waiting for events. onload is a special function in Obsidian plugins that is called when the plugin is loaded. This is where we will set up our plugin, register commands, and listen for events. Onload is the main entry point of the plugin. When the user enables the plugin, this function will be executed. We will use this function to initialize our plugin, load existing tags from the vault, and set up event listeners for changes in the vault and editor.
		console.log('Auto Tag Words: Plugin started'); // This is a simple log statement to indicate that the plugin has started. It will appear in the console when the plugin is loaded. This can be useful for debugging and confirming that the plugin is working.
		
		// This is the manual command for console use to trigger a word scan on all files and tag if neccessary.
		this.addCommand({ // this refers to the plugin instance. addCommand is a method provided by the Plugin class that allows us to register a new command in Obsidian. A command is an action that can be triggered by the user, either through the command palette, a hotkey, or a button. The addCommand method takes an object as an argument, which defines the properties of the command, such as its id, name, and callback function.
			id: 'auto-tag-scan-all', // This is a unique identifier for the command. It should be a string that describes the command and is not used by any other command in the plugin. This id can be used to reference the command programmatically, for example, if we want to trigger it from another part of the code.
			name: 'Scan all files and add tags', // This is the name of the command that will appear in the command palette. It should be a descriptive name that tells the user what the command does. In this case, it indicates that the command will scan all files in the vault and add tags where necessary.
			callback: () => { // This is the function that will be executed when the command is triggered. In this case, we are using an arrow function to define the callback. callback is a property of the command object that specifies what should happen when the user executes the command. 
				console.log('Auto Tag Words: Scan started...'); // This log statement indicates that the manual scan has started. It will appear in the console when the user triggers the command. This can be useful for debugging and confirming that the command is working.
				this.processAllFiles(); // This calls the processAllFiles method of the plugin, which we will define later. This method will go through all the markdown files in the vault and check for words that match our tags, converting them to tags if necessary. By calling this method in the callback of the command, we allow the user to manually trigger a scan of all files whenever they want, in addition to the automatic scanning that happens when files are modified.
			}
		});
		
		// Tags are loaded and registerd
		this.updateTags(); // This calls the updateTags method of the plugin, which we will define later. This method will go through all the markdown files in the vault and collect all the tags that are currently used in those files. It will populate the this.tags array with these tags. By calling this method in the onload function, we ensure that when the plugin starts, it has an up-to-date list of all tags in the vault to work with when converting words to tags in the editor. "this." refers to the current instance of the plugin, so we are calling the updateTags method that belongs to this plugin instance. This is important to define here, because we need to have the tags loaded before we can start converting words to tags in the editor or processing files.
		this.registerEvent( // This is a method provided by the Plugin class that allows us to register an event listener. An event listener is a function that will be called whenever a specific event occurs in Obsidian. In this case, we are listening for the 'changed' event on the metadataCache, which means that whenever there are changes to the metadata of any file (such as adding or removing tags), our callback function will be executed. This allows us to keep our list of tags up-to-date whenever there are changes in the vault.
			this.app.metadataCache.on('changed', () => {
				this.updateTags();
			})
		);
		
		// Looks for new events withing the vault.
		this.registerEvent( // Here again, we are listening for new events.
			this.app.vault.on('modify', (file: TFile) => { // app is for accessing Obsidian application, vault ist for the vault itself. ON is for listening to events. Modify is triggerd whenever a change happened. file: TFile means that the callback function will receive a file object of type TFile, which represents the file that was modified. This allows us to know which file was changed and process it accordingly.
				setTimeout(() => this.processFile(file), 1000); // Again a timeout is used to delay the processing of the file. This is because when a file is modified, there might be multiple changes happening in quick succession (for example, if the user is editing a file and saving it multiple times). By using a timeout, we can wait until the changes have settled before we process the file. In this case, we wait for 1000 milliseconds (1 second) after the modify event is triggered before we call the processFile method for that specific file. This helps to avoid unnecessary processing and ensures that we are working with the most up-to-date version of the file after all changes have been made.
			})
		);
		
		// When Plugin starts, every file is checked for new changes.
		this.processAllFiles(); // process all files is started.
		
		// This listener is looking for changes in the editor. An Editor is the actual working area. So this is live.
		this.registerEvent(
			this.app.workspace.on('editor-change', (editor: Editor) => { // Here is the location defined: editor. Editor: Editor means that the callback function will receive an editor object of type Editor, which represents the editor that has changed.
				if (this.timeout) clearTimeout(this.timeout); // again a timeout.
				this.timeout = setTimeout(() => this.convertWordsToTags(editor), 800); // here the timeout is defined.
			})
		);
	}

	// All Tags are collected and stored here.
	updateTags() { // A methode called updateTags is defined
		this.tags = []; // The tags array is reset. This needs to happen every time we update the tags, because we always need the latest list of tags from the vault. So, no duplicates
		const files = this.app.vault.getMarkdownFiles(); // const files defines a unchanging cariable "files". this.app.vault.getMarkdownFiles() retrieves all markdown files.
		for (const file of files) { // "files" is an array of all markdown files collected. So here is a loop going through each of the files of the "files" array.
			const cache = this.app.metadataCache.getFileCache(file); // cache is defined as metadata cache for the current file in the loop. A metadata cache is a data structure that Obsidian uses to store information about files, such as their tags, links, and other metadata. By calling this.app.metadataCache.getFileCache(file), we are retrieving the metadata cache for the current file, which allows us to access its tags and other information without having to read the file content directly. This is more efficient and faster than reading the file content, especially for large files or when we only need the metadata.
			if (cache?.tags) { // Here we check, if there are tags stored in the files cache. The ? is optional chaining, which means that if cache is null or undefined, it will not throw an error and will simply return undefined. If there are tags in the cache, we proceed to loop through them.
				for (const tag of cache.tags) { // If tags are found, we loop through each tag.
					if (!this.tags.includes(tag.tag)) { // If this tag is not alrady in our this.tags array, we add it.
						this.tags.push(tag.tag); // Push adds the new tag to the end of the this.tags array.
					}
				}
			}
		}
		console.log(`Auto Tag Words: ${this.tags.length} Tags found`); // If a tag is found and added, a notification in the console is created.
	}

	// A private methos is defined to escape special characters in name tags. Special charakters are often part of the Regex pattern.
	private escapeRegExp(string: string): string { // A string is turned into a string with escaped special characters. 
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // For example: For Tag "C++" the + would be a roule in regex, so it is escpaped to "C\+\+" to be treated as a normal string.
	}

	// Files are processed here. This is where the content of the file is read, checked for words that match our tags, and updated if necessary.
	async processFile(file: TFile) { // "TFile" respresents a file in Obsidian. "file: TFile" means that the "processFile" method takes a parameter called "file", which is of typr "TFile". This allows us to work with the file object and access its properties and methods to read and modify the file content.
		if (!file.extension.includes('md')) return; // If a "file" in the vault ends in .md, therefore is a markdown file, it is processed. 
		
		try { // "try" is an integrated errorhandling in JavaScript. If everything is ok, it continues, if not, it jumps to the catch block on the bottom.
			const content = await this.app.vault.read(file); // The files content is "read" and stored in the content variable. Await is needed, because reading a file (asynchronous operation) may take time. Asynchronous means that the code can continue while we wait.
			let newContent = content; // The difference between const and let is, that let can be changed later. This is important, because we need to modify the content of the file. newContent is initialized with the original content of the file, but we will update it if we find any words that match our tags. By using let, we can reassign newContent to the updated version of the content as we process it.
			let changed = false; // Initialy no changes are needed, so changed is set to false. If a change is made changed is set to true bellow.
			
			for (const tag of this.tags) { // We loop through each tag in our this.tags array.
				const word = tag.slice(1).toLowerCase(); // For more precise matching, the tag gets transformed to a word with lowercase letters and without the # (indicating a tag). So it is matched more accurately.
				const escapedWord = this.escapeRegExp(word); // escapeWord is defined as the word pulled from the file and run through the "escapeRegExp" methode to make it regexable.
				const regex = new RegExp(`(?<!#)\\b${escapedWord}\\b`, 'gi'); // The escaped word (escapeWord) is then put into a regex pattern.
				
				const updatedContent = newContent.replace(regex, `#${word}`); // A new variable is created, which represents the new conent of the file after replacing any words with the corresponding tag. (first we look for the word, the we replace it with the word after adding a # infront)
				if (updatedContent !== newContent) { // If "updateContent" is different from "newContent" -> change was made.
					newContent = updatedContent; // "newContend" is updated to the new updated version including the new tags.
					changed = true; // If a change was made, the status gets set to true.
				}
			}
			
			if (changed) { // If status changed changes to true
				await this.app.vault.modify(file, newContent); // The file is updated with the new content ingcluding the tags.
				console.log(`Auto Tag Words: ${file.basename} was tagged`); // A respective notification is created in the console.
			}
		} catch (error) { // Errorhandling.
			console.error(`Auto Tag Words: Dick stuck in blender ${file.basename}:`, error); // An error message is created
		}
	}

	// A method to look through all the files in the vault.
	async processAllFiles() { // Method is defined and does not take any parameters.
		console.log('Auto Tag Words: Snooping through your files...'); // A console message is displayed.
		const files = this.app.vault.getMarkdownFiles(); // All markdownfiles get pulled. 
		
		for (const file of files) { // We work our way through all the files of the "files" array.
			await this.processFile(file); // The process is asyncronous, so we wait. The file is processed
		}
		console.log('Auto Tag Words: No more snooping to be done'); // Once all files have been checked, there is a notification displayed in the console.
	}

	convertWordsToTags(editor: Editor) { // A method is defined. In () we define a parameter ("editor") and set it to datatype "Editor". "Editor" is included in Typescript.
		const text = editor.getValue(); // The editor gets the currrent text content.
		let changed = false; // Again, at the start, we set the changed baseline to be false.
		
		for (const tag of this.tags) { // We loop through all the tags in the "this.tags" array.
			const word = tag.slice(1).toLowerCase(); // Each word is sliced and lowercased, so we are more accurate while tagging.
			const escapedWord = this.escapeRegExp(word); // The new sliced and lowercased word is run through the "escapedRegExp" function to be cleaned up and ready to be used for regexing.
			const regex = new RegExp(`(?<!#)\\b${escapedWord}\\b`, 'gi'); // The cleaned word is pasted into a Regex search.
			
			const newText = text.replace(regex, `#${word}`); // A word is replaced with its tag.
			if (newText !== text) { // If the new text does not match the old text. -> this means we just changed something (converted a word into a tag).
				editor.setValue(newText); // The old editor content is now replaced with the new content including the new tags.
				changed = true; // If there was a change, the changed variable gets set to true.
			}
		}
	}
}
