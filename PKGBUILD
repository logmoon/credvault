# Maintainer: logmoon <amen.benaissa09@gmail.com>
# Contributor: logmoon <amen.benaissa09@gmail.com>

pkgname=credvault-bin
pkgver=0.1.0
pkgrel=1
pkgdesc="Local-first, zero-knowledge credential manager — one encrypted vault file, one master password, no accounts, no servers"
arch=('x86_64')
url="https://github.com/logmoon/credvault"
license=('GPL-3.0-or-later')
source=("CredVault_${pkgver}_amd64.AppImage::https://github.com/logmoon/credvault/releases/download/v${pkgver}/CredVault_${pkgver}_amd64.AppImage")
sha256sums=('34998b391aa6002499e7f9abc443827f8246cd6c8771e71fa45aae9106941310')

# The AppImage carries its own bundled GTK stack — no fuse2 needed because we
# extract at build time instead of mounting. Nothing is stripped: the bundle
# ships pre-stripped libraries and Arch's strip is unnecessary (and risky) here.
options=('!strip')

package() {
  cd "$srcdir"
  chmod +x "CredVault_${pkgver}_amd64.AppImage"
  "./CredVault_${pkgver}_amd64.AppImage" --appimage-extract

  install -dm755 "$pkgdir/opt/credvault"
  cp -a squashfs-root/. "$pkgdir/opt/credvault/"

  install -dm755 "$pkgdir/usr/bin"
  ln -s /opt/credvault/AppRun "$pkgdir/usr/bin/credvault"

  install -Dm644 squashfs-root/usr/share/applications/CredVault.desktop \
    "$pkgdir/usr/share/applications/CredVault.desktop"

  install -dm755 "$pkgdir/usr/share/icons/hicolor"
  cp -a squashfs-root/usr/share/icons/hicolor/. "$pkgdir/usr/share/icons/hicolor/"
}
