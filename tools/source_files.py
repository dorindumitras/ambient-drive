"""The complete redistributable source snapshot, excluding generated output."""
from pathlib import Path
import zipfile

EXCLUDED = {'.git', 'dist', 'release', 'validation', 'publication', '__pycache__', 'node_modules', 'oap-sdk'}


def source_files(root):
    for file in sorted(Path(root).rglob('*')):
        relative = file.relative_to(root)
        if any(part in EXCLUDED for part in relative.parts):
            continue
        if file.is_symlink():
            raise ValueError('Source snapshot cannot contain links: ' + str(relative))
        if file.is_file() and file.name != '.DS_Store' and file.suffix not in {'.pyc', '.tgz', '.mgu', '.zip'}:
            yield file


def zip_bytes(archive, name, data):
    info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = 0o100644 << 16
    archive.writestr(info, data)


def source_zip(root, destination):
    with zipfile.ZipFile(destination, 'w') as archive:
        for file in source_files(root):
            zip_bytes(archive, 'ambient-drive/' + file.relative_to(root).as_posix(), file.read_bytes())
