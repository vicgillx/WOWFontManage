use std::env;
use std::path::PathBuf;

pub fn candidate_wow_roots() -> Vec<PathBuf> {
    let mut roots = Vec::new();

    #[cfg(target_os = "windows")]
    {
        roots.extend([
            PathBuf::from(r"C:\Program Files (x86)\World of Warcraft"),
            PathBuf::from(r"C:\Program Files\World of Warcraft"),
        ]);

        for drive in 'D'..='Z' {
            roots.push(PathBuf::from(format!("{drive}:\\World of Warcraft")));
        }
    }

    #[cfg(target_os = "macos")]
    {
        roots.push(PathBuf::from("/Applications/World of Warcraft"));

        if let Some(home) = home_dir() {
            roots.push(home.join("Applications/World of Warcraft"));
        }
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        if let Some(home) = home_dir() {
            roots.push(home.join("World of Warcraft"));
        }
    }

    roots
}

fn home_dir() -> Option<PathBuf> {
    env::var_os("HOME")
        .map(PathBuf::from)
        .or_else(|| env::var_os("USERPROFILE").map(PathBuf::from))
}
