use std::io::{Error, ErrorKind};

pub trait FromHex {
    /// Converts the value of `self`, interpreted as hexadecimal encoded data,
    /// into an owned vector of bytes, returning the vector.
    fn from_hex(&self) -> Result<Vec<u8>, Error>;
}

impl FromHex for str {
    /// Convert any hexadecimal encoded string (literal, `@`, `&`, or `~`)
    /// to the byte values it encodes.
    ///
    /// You can use the `String::from_utf8` function to turn a
    /// `Vec<u8>` into a string with characters corresponding to those values.
    ///
    /// # Examples
    ///
    /// This converts a string literal to hexadecimal and back.
    ///
    /// ```
    /// #![feature(rustc_private)]
    ///
    /// extern crate serialize;
    /// use serialize::hex::{FromHex, ToHex};
    ///
    /// fn main () {
    ///     let hello_str = "Hello, World".as_bytes().to_hex();
    ///     println!("{}", hello_str);
    ///     let bytes = hello_str.from_hex().unwrap();
    ///     println!("{:?}", bytes);
    ///     let result_str = String::from_utf8(bytes).unwrap();
    ///     println!("{}", result_str);
    /// }
    /// ```
    fn from_hex(&self) -> Result<Vec<u8>, Error> {
        // This may be an overestimate if there is any whitespace
        let mut b = Vec::with_capacity(self.len() / 2);
        let mut modulus = 0;
        let mut buf = 0;

        for (idx, byte) in self.bytes().enumerate() {
            buf <<= 4;

            match byte {
                b'A'...b'F' => buf |= byte - b'A' + 10,
                b'a'...b'f' => buf |= byte - b'a' + 10,
                b'0'...b'9' => buf |= byte - b'0',
                b' ' | b'\r' | b'\n' | b'\t' => {
                    buf >>= 4;
                    continue;
                }
                _ => {
                    let _ = self[idx..].chars().next().unwrap();
                    return Err(Error::new(ErrorKind::Other, "couldn't parse hex"));
                }
            }

            modulus += 1;
            if modulus == 2 {
                modulus = 0;
                b.push(buf);
            }
        }

        match modulus {
            0 => Ok(b.into_iter().collect()),
            _ => Err(Error::new(ErrorKind::Other, "couldn't parse hex")),
        }
    }
}
