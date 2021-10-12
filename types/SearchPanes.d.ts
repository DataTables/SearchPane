/// <reference types="jquery" />
/// <reference types="datatables.net" />
export declare function setJQuery(jq: any): void;
import { IClasses, IDefaults, IDOM, IS } from './panesType';
import SearchPane from './SearchPane';
export default class SearchPanes {
    private static version;
    private static classes;
    private static defaults;
    classes: IClasses;
    dom: IDOM;
    c: IDefaults;
    s: IS;
    constructor(paneSettings: any, opts: any, fromPreInit?: boolean, paneClass?: typeof SearchPane);
    /**
     * Clear the selections of all of the panes
     */
    clearSelections(): SearchPane[];
    /**
     * returns the container node for the searchPanes
     */
    getNode(): JQuery<HTMLElement>;
    /**
     * rebuilds all of the panes
     */
    rebuild(targetIdx?: boolean | number, maintainSelection?: boolean): SearchPane | SearchPane[];
    /**
     * Resizes all of the panes
     */
    resizePanes(): SearchPanes;
    /**
     * Updates the selectionList when cascade is not in place
     */
    _updateSelection(): void;
    _stateLoadListener(): void;
    /**
     * Attach the panes, buttons and title to the document
     */
    private _attach;
    /**
     * If there are no panes to display then this method is called to either
     * display a message in their place or hide them completely.
     */
    private _attachMessage;
    /**
     * Attaches the panes to the document and displays a message or hides if there are none
     */
    private _attachPaneContainer;
    /**
     * Checks which panes are collapsed and then performs relevant actions to the collapse/show all buttons
     */
    private _checkCollapse;
    /**
     * Attaches the message to the document but does not add any panes
     */
    private _checkMessage;
    /**
     * Collapses all of the panes
     */
    private _collapseAll;
    /**
     * Finds a pane based upon the name of that pane
     *
     * @param name string representing the name of the pane
     * @returns SearchPane The pane which has that name
     */
    private _findPane;
    /**
     * Gets the selection list from the previous state and stores it in the selectionList Property
     */
    private _getState;
    /**
     * Declares the instances of individual searchpanes dependant on the number of columns.
     * It is necessary to run this once preInit has completed otherwise no panes will be
     * created as the column count will be 0.
     *
     * @param table the DataTable api for the parent table
     * @param paneSettings the settings passed into the constructor
     * @param opts the options passed into the constructor
     */
    private _paneDeclare;
    /**
     * Sets the listeners for the collapse and show all buttons
     * Also sets and performs checks on current panes to see if they are collapsed
     */
    private _setCollapseListener;
    /**
     * Shows all of the panes
     */
    private _showAll;
    /**
     * Initialises the tables previous/preset selections and initialises callbacks for events
     *
     * @param table the parent table for which the searchPanes are being created
     */
    private _startup;
    /**
     * Updates the number of filters that have been applied in the title
     */
    private _updateFilterCount;
}
