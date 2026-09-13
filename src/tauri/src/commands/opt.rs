use std::collections::HashMap;
use serde_json::Value as JsonValue;
use tauri::command;

#[command]
pub fn opt_get_system_info() -> HashMap<String, [String; 2]> {
    let tauri_version = tauri::VERSION.to_string();
    let mut data = HashMap::new();
    data.insert(String::from("tauri"), [String::from("Tauri Version   "), tauri_version]);
    return data;
}

#[command]
pub fn opt_store(_key: String, _value: String) -> Result<(), String> {
    Ok(())
}

#[command]
pub fn opt_save_all(_data: HashMap<String, JsonValue>) -> Result<(), String> {
    Ok(())
}

#[command]
pub fn opt_get_all() -> Result<HashMap<String, String>, String> {
    Ok(HashMap::new())
}

#[command]
pub fn opt_get(_data: String) -> Result<String, String> {
    Ok(String::new())
}

#[command]
pub fn opt_clear_all() -> Result<(), String> {
    Ok(())
}
