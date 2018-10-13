extern crate bodyparser;
extern crate crypto;
extern crate iron;
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate serde_json;

mod hex;

use iron::prelude::*;
use iron::status;
use crypto::mac::Mac;
use serde_json::from_str;
use std::process::Command;
use std::env;
use std::thread;
use hex::FromHex;

#[derive(Clone, Deserialize)]
struct Secret {
    secret: String,
}

#[derive(Clone, Deserialize)]
struct APIRequest {
    #[serde(rename = "ref")] refs: String,
    commits: Vec<Commit>,
}

#[derive(Clone, Deserialize)]
struct Commit {
    added: Vec<String>,
    removed: Vec<String>,
    modified: Vec<String>,
}

fn main() {
    // Load the secret from ./secret.json
    let config: Secret = serde_json::from_str(include_str!("secret.json"))
        .expect("secret.json requires a 'secret' key that matches github repo!");

    Iron::new(move |req: &mut Request| {
        // Check if the Github secret exists
        let headers = req.headers.clone();
        let header = match headers.get_raw("X-Hub-Signature") {
            Some(h) => h.get(0).unwrap(),
            None => return Ok(Response::with((status::NotFound, "Missing Github Header."))),
        };

        // Create HMAC result handler from Hex value
        let header_str = String::from_utf8(header.to_vec()).unwrap();
        let header_split: Vec<&str> = header_str.split("sha1=").collect();
        let result = crypto::mac::MacResult::new(&header_split[1].from_hex().unwrap());

        // Compare HMAC of body to header signature.
        let mut hmac = crypto::hmac::Hmac::new(crypto::sha1::Sha1::new(), config.secret.as_bytes());
        let payload_str = match req.get::<bodyparser::Raw>() {
            Ok(Some(body)) => body,
            Ok(None) => return Ok(Response::with((status::NotFound, "Missing Request Body."))),
            Err(_) => return Ok(Response::with((status::NotFound, "UTF8 Error"))),
        };

        hmac.input(payload_str.as_bytes());
        let computed_result = hmac.result();

        // Get APIRequest
        let data: APIRequest = match from_str(&payload_str.as_str()) {
            Ok(r) => r,
            Err(_) => {
                return Ok(Response::with((
                    status::NotFound,
                    "Couldn't deserialize API request.",
                )))
            }
        };

        // Check if local and request secret matches
        if computed_result != result {
            return Ok(Response::with((
                status::NotFound,
                "Github header secret didn't match config secret.",
            )));
        } else {
            // Spawn thread to update local repo
            if data.refs != "refs/heads/master" {
                return Ok(Response::with((
                    status::NotFound,
                    "Push was not to master branch.",
                )));
            } else {

                // Depending on what's changed, update each package accordingly.
                let files: Vec<String> =
                    data.commits.into_iter().fold(vec![], |mut acc, commit| {
                        acc.extend(commit.added.iter().cloned());
                        acc.extend(commit.removed.iter().cloned());
                        acc.extend(commit.modified.iter().cloned());
                        acc
                    });

                let (has_frontend, has_backend, has_portfolio) =
                    files.iter().fold((false, false, false), |acc, file| {
                        (
                            file.contains("/frontend/") || acc.0,
                            file.contains("/backend/") || acc.1,
                            file.contains("/portfolio/") || acc.2,
                        )
                    });

                thread::spawn(move || {
                    Command::new("git")
                        .arg("pull")
                        .output()
                        .expect("Failed to pull from git!");

                    Command::new("yarn")
                        .current_dir(
                            env::current_dir()
                                .unwrap()
                                .join("../../")
                                .canonicalize()
                                .unwrap(),
                        )
                        .output()
                        .expect("Failed to run yarn!");

                    // Update Frontend
                    if has_frontend {
                        Command::new("npm")
                            .arg("--prefix")
                            .arg(
                                env::current_dir()
                                    .unwrap()
                                    .join("../frontend")
                                    .canonicalize()
                                    .unwrap(),
                            )
                            .arg("start")
                            .output()
                            .expect("Failed to run NPM script!");
                    }

                    // Update Backend
                    if has_backend || has_frontend {
                        Command::new("pkill")
                            .arg("node")
                            .output()
                            .expect("Failed to run proccess kill!");

                        Command::new("npm")
                            .arg("--prefix")
                            .arg(
                                env::current_dir()
                                    .unwrap()
                                    .join("../backend")
                                    .canonicalize()
                                    .unwrap(),
                            )
                            .arg("start")
                            .output()
                            .expect("Failed to run NPM script!");
                    }

                    // Update Portfolio
                    if has_portfolio {
                        Command::new("npm")
                            .arg("--prefix")
                            .arg(
                                env::current_dir()
                                    .unwrap()
                                    .join("../portfolio")
                                    .canonicalize()
                                    .unwrap(),
                            )
                            .arg("start")
                            .output()
                            .expect("Failed to run NPM script!");
                    }
                });
            }
        }

        Ok(Response::with((status::Ok, "Updated successfully.")))
    }).http("localhost:3030")
        .unwrap();
}
