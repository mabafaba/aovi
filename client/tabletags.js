// Description: User input for a table with tagify input fields. user can add/remove rows and name them.
// +-------------------------------------+---+
// | colors       | [red, green, blue]   | x |
// +-------------------------------------+---+
// | shapes       | [rectangle, circle]  | x |
// +- +++ -------------------------------+---+

// Dependencies: tagify.js, tagify.css

// Usage:

// <script src="tabletags.js"></script>
// 
// <div id="container"></div>
// <script>
// var container = document.getElementById('container');
// var tableTags = new TableTags(container);
// </script>

class TableTags {
    constructor(parentNode, initialRows) {
        // throw error if parentNode is not an element
        if (!(parentNode instanceof Element)) {
            throw new Error(`input to TableTags can't be ${typeof parentNode}, must be an element`);
        }

        this.parentNode = parentNode;
        this.rows = [];
        this.#loadDependencies()
        .catch((error) => {
            console.error('Failed to load dependencies:', error.message);
        }).then(() => {
            this.#initializeTableTagsUI()
            // add initial rows if provided
            if (initialRows) {
                initialRows.forEach((row) => {
                    this.addRow(row.name, row.values);
                });
            }
            // add one empty row to start
            this.addRow();
        })
        
        
        // add html elements to the parent node
        
    }
    
    
    
    #loadDependencies() {
        // Description: Load tagify CSS and JS dependencies
        // 1. Create a promise to handle the loading process
        // 2. Create variables to track the loading status of CSS and JS
        // 3. Create a link element for tagify CSS and append it to the document head
        // 4. Create a script element for tagify JS and append it to the document head
        // 5. Resolve the promise when both CSS and JS are loaded successfully
        // 6. Reject the promise if there is an error loading CSS or JS
        return new Promise((resolve, reject) => {
            let cssLoaded = false;
            let jsLoaded = false;
            
            // Load tagify CSS
            const tagifyCSS = document.createElement('link');
            tagifyCSS.rel = 'stylesheet';
            tagifyCSS.href = 'https://cdn.jsdelivr.net/npm/@yaireo/tagify/dist/tagify.css';
            tagifyCSS.onload = () => {
                cssLoaded = true;
                if (cssLoaded && jsLoaded) {
                    resolve();
                }
            };
            tagifyCSS.onerror = () => {
                reject(new Error('Failed to load tagify CSS'));
            };
            document.head.appendChild(tagifyCSS);
            
            // Load tagify JS
            const tagifyJS = document.createElement('script');
            tagifyJS.src = 'https://cdn.jsdelivr.net/npm/@yaireo/tagify/dist/tagify.js';
            tagifyJS.onload = () => {
                jsLoaded = true;
                if (cssLoaded && jsLoaded) {
                    resolve();
                }
            };
            tagifyJS.onerror = () => {
                reject(new Error('Failed to load tagify JS'));
            };
            document.head.appendChild(tagifyJS);
        });
    }
    
    
    #initializeTableTagsUI(){
        // Description: Create a table with UI elements and event listeners
        // 1. Create a table element and append it to the parent node
        // 2. Create a tbody element and append it to the table
        
        // Create the table
        var table = document.createElement('table');
        table.id = 'TableTagsTable';
        this.parentNode.appendChild(table);

        // Create the table body
        var tbody = document.createElement('tbody');
        table.appendChild(tbody);
    }    
    
    addRow(name = '', values = []) {
        // Description: Add a new feature row to the table
        // Parameters:
        // - name: string (optional) - The name of the feature
        // - values: array (optional) - The values of the feature
        // Logic:
        // 1. Create a new table row element for the feature
        // 2. Generate a unique ID for the row
        // 3. Create input fields for the feature name and values
        // 5. Add the feature row to the array of rows
        // 6. Append the feature row to the table body
        // 7. Initialize the tagify input field for the feature values
        // 8. Add an event listener that keeps one empty row at the end of the table and otherwise removes empty rows
        // 8. Return the created table row
        
        // Create a new table row for the feature
        var tr = document.createElement('tr');
        // new unique id: max existing id + 1, unless this is the first feature, in which case the id is 0
        var id = this.rows.length > 0 ? Math.max(...this.rows.map(f => f.id)) + 1 : 0;
        tr.id = id;
        
        tr.classList.add('featureRow');
        
        // Create the first column for the feature name
        var td1 = document.createElement('td');
        td1.classList.add('featureName');
        // set height to   height: 2.6em to match tagify input field
        var featureNameInput = document.createElement('input');
        featureNameInput.setAttribute('placeholder', 'data field name');

        // set height to '2.6em' to match tagify input field
        featureNameInput.style.height = '2.6em';
        // default content
        featureNameInput.value = name;
        td1.appendChild(featureNameInput);
        tr.appendChild(td1);
        
        // Create the second column for the feature value options
        var td2 = document.createElement('td');
        td2.classList.add('featureValues');
        var featureValueInput = document.createElement('input');
        featureValueInput.setAttribute('placeholder', 'options');
        // make placeholder text gray
        featureValueInput.style.color = 'gray';

        featureValueInput.classList.add('tagifyInputField');
        // default content
        
        
        td2.appendChild(featureValueInput);
        tr.appendChild(td2);
                
        // Add the created feature row to the array of features
        this.rows.push(tr);
        
        // Add the created feature row to the table
        this.parentNode.getElementsByTagName('tbody')[0].appendChild(tr);
        
        // tagify
        featureValueInput.tagify = new Tagify(featureValueInput);
        // add example values
        featureValueInput.tagify.addTags(values.map(value => ({ value: value })));
        // Return the created table row

        // add event listener for editing the row
        featureNameInput.addEventListener('input', () => this.#onRowEdit(id, 'name',featureNameInput.value, featureValueInput.tagify.value));
        featureValueInput.tagify.on('change', () => this.#onRowEdit(id, 'tags',featureNameInput.value, featureValueInput.tagify.value));

        return tr;
    }

    #onRowEdit(id, editingWhat, name, values) {
        // make sure there is always one empty row at the end of the table            
        this.#haveOneEmptyRowToEnd();
        // if row is now empty, remove it
        if (name == '' && values.length == 0) {
            // remove the row
            this.removeRow(id);

            // focus on the new empty row, either on the name or the tag input depending on which was just emptied
            var rows = this.parentNode.getElementsByTagName('tr');
            var lastRow = rows[rows.length - 1];
            if(editingWhat == 'name'){
                lastRow.getElementsByTagName('td')[0].getElementsByTagName('input')[0].focus();
            }
            if(editingWhat == 'tags'){
                // lastRow.getElementsByTagName('td')[1].getElementsByTagName('input')[0].focus();
                // set focus to name regardless because tagify has weird bug where when setting focus it breaks
                lastRow.getElementsByTagName('td')[0].getElementsByTagName('input')[0].focus();
            }
        }

        
        
    }

    removeRow(id) {

        // Description: Remove a feature row from the table
        // Parameters:
        // - id: number - The ID of the row to remove. this is not the array index but the id number stored in the row element.
        // Logic:
        // 1. Find the index of the row with the matching ID in the array of rows
        // 2. Remove the row from the table body

        // Remove the feature from the array of features where the id matches
        var index = this.rows.findIndex(f => f.id == id);
        
        this.rows.splice(index, 1);
        // Remove the row from the table body
        var row = this.parentNode.querySelector(`tr[id="${id}"]`);
        row.parentNode.removeChild(row);



    }

    #haveOneEmptyRowToEnd() {
        // Description: Add an empty row to the end of the table
        // Logic:
        // 1. Get the last row from the table
        // 2. Check if the feature name and values are empty
        // 3. Add a new empty row if the last row is not empty

        // get last row
        var rows = this.parentNode.getElementsByTagName('tr');
        var lastRow = rows[rows.length - 1];
        var featureName = lastRow.getElementsByTagName('td')[0].getElementsByTagName('input')[0].value;
        var featureValues = lastRow.getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
        if (featureName != '' || featureValues != '') {
            this.addRow();
        }
    }


    get data() {
        // Description: Get the data from the table as an array of objects with feature names and values
        // Logic:
        // 1. Get all rows from the table
        // 2. Loop over the rows and extract the feature name and values
        // 3. Parse the values as JSON and convert them to an array of values
        // 4. Return an array of objects with feature names and values
        
        // get all rows
        var rows = this.parentNode.getElementsByTagName('tr');
        
        // loop over rows and extract data to features array
        var features = [];
        for (var i = 0; i < rows.length; i++) {
            // get feature name and feature values
            var featureName = rows[i].getElementsByTagName('td')[0].getElementsByTagName('input')[0].value;
            var featureValues = rows[i].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
            // json parse, empty array if empty string or no values
            if (featureValues == '') {
                featureValues = [];
            } else {
                featureValues = JSON.parse(featureValues).map((value) => value.value);
            }
            
            features.push({ name: featureName, values: featureValues });

        }
        // double check last row is empty as expected and remove it if it is.
        if (features[features.length - 1].name == '' && features[features.length - 1].values.length == 0) {
            features.pop(); // pop means remove last element
        }
        return features;
    }
}

// expose
window.TableTags = TableTags;