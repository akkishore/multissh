mkdir release/temp
./node_modules/.bin/pkg -t node10-mac,node10-linux,node10-win --out-path ./release/temp .
mv release/temp/multissh-linux ./release/multissh-linux/multissh
mv release/temp/multissh-macos ./release/multissh-macos/multissh
mv release/temp/multissh-win.exe ./release/multissh-win/multissh.exe
rmdir release/temp
