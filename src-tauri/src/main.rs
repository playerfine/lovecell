// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod state;
use std::sync::Mutex;

use state::{AppState, Location};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn get_sheet(state: tauri::State<Mutex<AppState>>) -> Vec<state::Row> {
    state.lock().unwrap().get_sheet()
}

#[tauri::command]
fn select_cell(state: tauri::State<Mutex<AppState>>, x: usize, y: usize) -> Vec<state::Location> {
    state.lock().unwrap().set_selected_cell(x, y)
}

#[tauri::command]
fn select_cells(
    state: tauri::State<Mutex<AppState>>,
    cells: Vec<Location>,
) -> Vec<state::Location> {
    state.lock().unwrap().set_selected_cells(cells)
}

fn main() {
    let state = AppState::default();

    tauri::Builder::default()
        .manage(Mutex::new(state))
        .invoke_handler(tauri::generate_handler![
            get_sheet,
            select_cell,
            select_cells
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
