use crate::platform;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use time::{format_description, OffsetDateTime};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FontProfile {
    id: String,
    name: String,
    description: String,
    directory_markers: Vec<String>,
    template_file_names: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WowInstallation {
    product_id: String,
    product_name: String,
    root_path: String,
    product_path: String,
    fonts_path: String,
    exists: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyFontPackRequest {
    product_path: String,
    source_font_path: String,
    target_file_names: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FontAssignment {
    source_font_path: Option<String>,
    target_file_names: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyFontConfigRequest {
    product_path: String,
    assignments: Vec<FontAssignment>,
}

#[tauri::command]
pub fn get_font_profiles() -> Vec<FontProfile> {
    font_profiles()
}

#[tauri::command]
pub fn scan_wow_installations(root_path: Option<String>) -> Result<Vec<WowInstallation>, String> {
    let roots: Vec<PathBuf> = match root_path {
        Some(path) => {
            let root = PathBuf::from(path.trim());
            if !root.exists() {
                return Err("所选路径不存在".into());
            }
            if !root.is_dir() {
                return Err("请选择文件夹，而不是单个文件".into());
            }
            vec![root]
        }
        None => platform::candidate_wow_roots()
            .into_iter()
            .filter(|root| root.exists())
            .collect(),
    };

    Ok(collect_installations(roots))
}

fn collect_installations(roots: Vec<PathBuf>) -> Vec<WowInstallation> {
    let profiles = font_profiles();
    let mut installations = Vec::new();

    for root in roots {
        for profile in &profiles {
            for marker in &profile.directory_markers {
                let product_path = root.join(marker);

                if product_path.exists() {
                    installations.push(WowInstallation {
                        product_id: profile.id.clone(),
                        product_name: profile.name.clone(),
                        root_path: path_to_string(&root),
                        fonts_path: path_to_string(&product_path.join("Fonts")),
                        product_path: path_to_string(&product_path),
                        exists: true,
                    });
                    break;
                }
            }
        }
    }

    installations
}

#[tauri::command]
pub fn backup_fonts(product_path: String) -> Result<String, String> {
    let product_path = PathBuf::from(product_path);
    let fonts_path = product_path.join("Fonts");

    if !fonts_path.exists() {
        fs::create_dir_all(&fonts_path).map_err(error_to_string)?;
        return Ok(path_to_string(&fonts_path));
    }

    let backup_path = product_path.join(format!("Fonts.backup-{}", timestamp()?));
    copy_dir_all(&fonts_path, &backup_path).map_err(error_to_string)?;
    Ok(path_to_string(&backup_path))
}

#[tauri::command]
pub fn apply_font_pack(request: ApplyFontPackRequest) -> Result<String, String> {
    let product_path = PathBuf::from(&request.product_path);
    let fonts_path = product_path.join("Fonts");
    let source_font_path = PathBuf::from(&request.source_font_path);
    let had_fonts_dir = fonts_path.exists();

    validate_font_source(&source_font_path)?;
    fs::create_dir_all(&fonts_path).map_err(error_to_string)?;

    if had_fonts_dir {
        let _ = backup_fonts(request.product_path.clone())?;
    }

    for file_name in &request.target_file_names {
        validate_template_file_name(file_name)?;
        fs::copy(&source_font_path, fonts_path.join(file_name)).map_err(error_to_string)?;
    }

    Ok(path_to_string(&fonts_path))
}

#[tauri::command]
pub fn apply_font_config(request: ApplyFontConfigRequest) -> Result<String, String> {
    let product_path = PathBuf::from(&request.product_path);
    let fonts_path = product_path.join("Fonts");
    let had_fonts_dir = fonts_path.exists();

    if had_fonts_dir {
        let _ = backup_fonts(request.product_path.clone())?;
    }

    fs::create_dir_all(&fonts_path).map_err(error_to_string)?;

    for assignment in &request.assignments {
        for file_name in &assignment.target_file_names {
            validate_template_file_name(file_name)?;
        }

        match &assignment.source_font_path {
            Some(source_font_path) => {
                let source_font_path = PathBuf::from(source_font_path);
                validate_font_source(&source_font_path)?;
                for file_name in &assignment.target_file_names {
                    fs::copy(&source_font_path, fonts_path.join(file_name)).map_err(error_to_string)?;
                }
            }
            None => {
                for file_name in &assignment.target_file_names {
                    let target = fonts_path.join(file_name);
                    if target.exists() {
                        fs::remove_file(target).map_err(error_to_string)?;
                    }
                }
            }
        }
    }

    Ok(path_to_string(&fonts_path))
}

fn font_profiles() -> Vec<FontProfile> {
    vec![
        FontProfile {
            id: "retail".into(),
            name: "正式服".into(),
            description: "国服正式服，通常对应 _retail_ 客户端目录。".into(),
            directory_markers: vec!["_retail_".into()],
            template_file_names: vec![
                "ARHei.TTF".into(),
                "ARKai_C.TTF".into(),
                "ARKai_T.TTF".into(),
                "FRIZQT__.TTF".into(),
                "ARIALN.TTF".into(),
                "FZBWJW.TTF".into(),
                "FZXHJW.TTF".into(),
            ],
        },
        FontProfile {
            id: "classic-era".into(),
            name: "时光服".into(),
            description: "经典旧世/时光服，优先识别 _classic_era_，兼容 _classic_。".into(),
            directory_markers: vec!["_classic_era_".into(), "_classic_".into()],
            template_file_names: classic_template_file_names(),
        },
        FontProfile {
            id: "mists-classic".into(),
            name: "熊猫人怀旧服".into(),
            description: "熊猫人怀旧服，通常对应 _classic_ 客户端目录。".into(),
            directory_markers: vec!["_classic_".into()],
            template_file_names: classic_template_file_names(),
        },
    ]
}

fn classic_template_file_names() -> Vec<String> {
    vec![
        "FRIZQT__.TTF".into(),
        "ARIALN.TTF".into(),
        "ARKai_T.TTF".into(),
        "ARHei.TTF".into(),
        "ARKai_C.TTF".into(),
        "ZYHei.TTF".into(),
        "ZYKai_C.TTF".into(),
        "ZYKai_T.TTF".into(),
    ]
}

fn validate_font_source(path: &Path) -> Result<(), String> {
    if !path.exists() {
        return Err("源字体文件不存在".into());
    }

    let extension = path
        .extension()
        .and_then(|extension| extension.to_str())
        .unwrap_or_default();

    if !extension.eq_ignore_ascii_case("ttf") {
        return Err("当前版本仅支持 .ttf 字体文件".into());
    }

    Ok(())
}

fn validate_template_file_name(file_name: &str) -> Result<(), String> {
    if file_name.contains('/') || file_name.contains('\\') || file_name.contains("..") {
        return Err(format!("非法字体模板文件名：{file_name}"));
    }

    if !file_name.to_ascii_lowercase().ends_with(".ttf") {
        return Err(format!("字体模板必须以 .TTF 结尾：{file_name}"));
    }

    Ok(())
}

fn copy_dir_all(source: &Path, destination: &Path) -> std::io::Result<()> {
    fs::create_dir_all(destination)?;

    for entry in fs::read_dir(source)? {
        let entry = entry?;
        let file_type = entry.file_type()?;
        let target = destination.join(entry.file_name());

        if file_type.is_dir() {
            copy_dir_all(&entry.path(), &target)?;
        } else {
            fs::copy(entry.path(), target)?;
        }
    }

    Ok(())
}

fn timestamp() -> Result<String, String> {
    let format = format_description::parse("[year][month][day]-[hour][minute][second]")
        .map_err(error_to_string)?;
    let now = OffsetDateTime::now_local().unwrap_or_else(|_| OffsetDateTime::now_utc());
    now.format(&format).map_err(error_to_string)
}

fn path_to_string(path: &Path) -> String {
    path.to_string_lossy().into_owned()
}

fn error_to_string(error: impl std::fmt::Display) -> String {
    error.to_string()
}
