use std::sync::Mutex;

use serde::{Deserialize, Serialize};

const DEFAULT_SIZE: usize = 100;

impl Default for AppState {
    fn default() -> AppState {
        let mut sheet: Vec<Row> = vec![];
        for y in 0..DEFAULT_SIZE {
            let mut cells: Vec<Cell> = vec![];
            for x in 0..DEFAULT_SIZE {
                cells.push(Cell::default(x, y))
            }
            sheet.push(Row { cells })
        }
        AppState {
            sheet: Mutex::new(sheet),
            selected_cells: Mutex::new(vec![]),
        }
    }
}

#[derive(Serialize)] // Ensure AppState can be cloned
pub struct AppState {
    sheet: Mutex<Vec<Row>>,
    pub selected_cells: Mutex<Vec<Location>>,
}

impl AppState {
    pub fn clear_selected_cells(&self) {
        let mut cells = self.selected_cells.lock().unwrap();
        cells.clear()
    }
    pub fn set_selected_cell(&self, x: usize, y: usize) -> Vec<Location> {
        let mut cells = self.selected_cells.lock().unwrap();
        let found_position = cells.iter().position(|cell| cell.0 == x && cell.1 == y);
        if let Some(index) = found_position {
            cells.remove(index);
        } else {
            cells.push(Location(x, y));
        }
        cells.to_vec()
    }

    pub fn set_selected_cells(&self, cells: Vec<Location>) -> Vec<Location> {
        self.clear_selected_cells();
        cells.iter().for_each(|x| {
            self.set_selected_cell(x.0, x.1);
        });

        self.selected_cells.lock().unwrap().to_vec()
    }

    pub fn get_sheet(&self) -> Vec<Row> {
        self.sheet.lock().unwrap().to_vec()
    }
}

impl Cell {
    fn default(x: usize, y: usize) -> Self {
        Self {
            value: String::new(),
            location: Location(x, y),
        }
    }
}
#[derive(Clone, Serialize, Deserialize)]
pub struct Location(usize, usize);

#[derive(Clone, Serialize)]
struct Cell {
    value: String,
    location: Location,
}

#[derive(Clone, Serialize)]
pub struct Row {
    cells: Vec<Cell>,
}
