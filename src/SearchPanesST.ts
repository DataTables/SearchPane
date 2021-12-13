import { ISVT } from './panesType';
import SearchPaneCascade from './SearchPaneCascade';
import SearchPaneCascadeViewTotal from './SearchPaneCascadeViewTotal';
import SearchPanes from './SearchPanes';
import SearchPaneViewTotal from './SearchPaneViewTotal';

export default class SearchPanesST extends SearchPanes {

	public s: ISVT;

	public constructor(paneSettings, opts, fromPreInit = false) {
		let paneClass;
		if(opts.cascadePanes && opts.viewTotal) {
			paneClass = SearchPaneCascadeViewTotal;
		}
		else if(opts.cascadePanes) {
			paneClass = SearchPaneCascade;
		}
		else if(opts.viewTotal) {
			paneClass = SearchPaneViewTotal;
		}
		super(paneSettings, opts, fromPreInit, paneClass);

		let loadedFilter = this.s.dt.state.loaded();

		let loadFn = () => this._initSelectionListeners(
			loadedFilter && loadedFilter.searchPanes && loadedFilter.searchPanes.selectionList ?
				loadedFilter.searchPanes.selectionList :
				this.c.preSelect
		);

		this.s.dt.off('init.dtsps').on('init.dtsps', loadFn);
	}

	/**
	 * Set's the function that is to be performed when a state is loaded
	 *
	 * Overrides the method in SearchPanes
	 */
	protected _stateLoadListener() {
		let stateLoadFunction = (e, settings, data) => {
			if (data.searchPanes === undefined) {
				return;
			}
			// Set the selection list for the panes so that the correct
			// rows can be reselected and in the right order
			this.s.selectionList =
				data.searchPanes.selectionList ?
					data.searchPanes.selectionList :
					[];

			// Find the panes that match from the state and the actual instance
			if (data.searchPanes.panes) {
				for (let loadedPane of data.searchPanes.panes) {
					for (let pane of this.s.panes) {
						if (loadedPane.id === pane.s.index) {
							// Set the value of the searchbox
							pane.dom.searchBox.val(loadedPane.searchTerm);
							// Set the value of the order
							pane.s.dtPane.order(loadedPane.order);
						}
					}
				}
			}

			this._updateSelectionList();
		};
		this.s.dt.off('stateLoadParams.dtsps', stateLoadFunction).on('stateLoadParams.dtsps', stateLoadFunction);
	}

	/**
	 * Remove the function's actions when using cascade
	 *
	 * Overrides the method in SearchPanes
	 */
	protected _updateSelection() {
		return;
	}

	/**
	 * Retrieve the total values from the server data
	 */
	protected _serverTotals() {
		for (let pane of this.s.panes) {
			let colTitle = this.s.dt.column(pane.s.index).dataSrc();
			let blockVT = true;

			// If any of the counts are not equal to the totals filtering must be active
			for (let data of this.s.serverData.searchPanes.options[colTitle]) {
				if (data.total !== data.count) {
					blockVT = false;
					break;
				}
			}

			// Set if filtering is present on the pane and populate the data arrays
			pane.s.filteringActive = !blockVT;
			pane._serverPopulate(this.s.serverData);
		}
	}

	/**
	 * Ensures that the correct selection listeners are set for selection tracking
	 *
	 * @param preSelect Any values that are to be preselected
	 */
	private _initSelectionListeners(preSelect) {
		this.s.selectionList = preSelect;

		// Set selection listeners for each pane
		for (let pane of this.s.panes) {
			if (pane.s.displayed) {
				pane.s.dtPane
					.off('select.dtsp')
					.on('select.dtsp', this._update(pane))
					.off('deselect.dtsp')
					.on('deselect.dtsp', this._update(pane));
			}
		}

		// Update on every draw
		this.s.dt.off('draw.dtsps').on('draw.dtsps', this._update());

		// Also update right now as table has just initialised
		this._updateSelectionList();
	}

	/**
	 * Returns a function that updates the selection list based on a specific pane
	 *
	 * @param pane the pane that is to have it's selections loaded
	 */
	private _update(pane=undefined) {
		return () => this._updateSelectionList(pane);
	}

	/**
	 * Updates the selection list to include the latest selections for a given pane
	 *
	 * @param index The index of the pane that is to be updated
	 * @param selected Which rows are selected within the pane
	 */
	private _updateSelectionList(paneIn = undefined) {
		if(this.s.updating || paneIn && paneIn.s.serverSelecting) {
			return;
		}

		let index;
		if(paneIn !== undefined) {
			if(this.s.dt.page.info().serverSide) {
				paneIn._updateSelection();
			}
			let rows = paneIn.s.dtPane.rows({selected: true}).data().toArray().map(el => el.filter);
			index = paneIn.s.index;
			this.s.selectionList = this.s.selectionList.filter(selection => selection.column !== index);
			if (rows.length > 0) {
				this.s.selectionList.push({
					column: index,
					rows
				});
			}
			else {
				index = this.s.selectionList.length > 0 ?
					this.s.selectionList[this.s.selectionList.length-1].column :
					undefined;
			}
			if(this.s.dt.page.info().serverSide) {
				this.s.dt.draw(false);
			}
		}

		this._remakeSelections();
	}

	private _remakeSelections() {
		this.s.updating = true;
		if(!this.s.dt.page.info().serverSide) {
			let tmpSL = this.s.selectionList;
			let anotherFilter = false;
			this.clearSelections();
			this.s.dt.draw();
			if(this.s.dt.rows().toArray()[0].length > this.s.dt.rows({search: 'applied'}).toArray()[0].length) {
				anotherFilter = true;
			}
			this.s.selectionList = tmpSL;
			for(let pane of this.s.panes) {
				if (pane.s.displayed) {
					pane.s.filteringActive = anotherFilter;
					pane.updateRows();
				}
			}
			for(let selection of this.s.selectionList) {
				let pane = this.s.panes[selection.column];
				let ids = pane.s.dtPane.rows().indexes().toArray();
				for(let row of selection.rows) {
					for(let id of ids) {
						let currRow = pane.s.dtPane.row(id);
						let data = currRow.data();
						if (row === data.filter) {
							currRow.select();
						}
					}
				}
				pane.s.selections = selection.rows;
				this.s.dt.draw();
				let filteringActive = false;

				let filterCount = 0;
				let prevSelectedPanes = 0;
				let selectedPanes = 0;
				// Add the number of all of the filters throughout the panes
				for (let currPane of this.s.panes) {
					if (currPane.s.dtPane) {
						filterCount += currPane.getPaneCount();
						if (filterCount > prevSelectedPanes) {
							selectedPanes++;
							prevSelectedPanes = filterCount;
						}
					}
				}
				filteringActive = filterCount > 0;
				for(let currPane of this.s.panes) {
					if(currPane.s.displayed) {
						if (anotherFilter || pane.s.index !== currPane.s.index || !filteringActive) {
							currPane.s.filteringActive = filteringActive || anotherFilter;
						}
						else if (selectedPanes === 1) {
							currPane.s.filteringActive = false;
						}
						if(currPane.s.index !== pane.s.index) {
							currPane.updateRows();
						}
					}
				}
			}
			this.s.dt.draw();
		}
		else {
			let pane;
			if(this.s.selectionList.length > 0) {
				pane = this.s.panes[this.s.selectionList[this.s.selectionList.length-1].column];
			}
			for(let currPane of this.s.panes) {
				if(currPane.s.displayed) {
					if(!pane || currPane.s.index !== pane.s.index) {
						currPane.updateRows();
					}
				}
			}
		}
		this.s.updating = false;
	}
}
