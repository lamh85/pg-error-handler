# `node-postgres` Error Handler

This app creates a more useful error message in `node-postgres`:
* Prints the error message from the library.
* Provides context by printing the lines before and after the error-causing line of the query.
* Prints the line numbers of the query.
* A karat (^) pointing at the error-causing character.
* Logs the query to a separate file.

Screenshot:

![Untitled](https://github.com/lamh85/pg-error-handler/assets/2058381/f4023c13-ac97-48d0-a38f-4ac8346ca2f5)
