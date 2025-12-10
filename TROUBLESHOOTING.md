# Troubleshooting Guide

## Python Virtual Environment Creation Error

### Error: `CREATE_VENV.PIP_FAILED_INSTALL_PYPROJECT`

**Problem**: VS Code/Cursor Python extension fails when creating a virtual environment because it tries to install the project from `pyproject.toml`.

**Solution**: This is a non-critical error. The project doesn't need to be installed as a package. Follow these steps:

#### Option 1: Manual Setup (Recommended)

1. **Create venv manually**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. **Select the interpreter** in VS Code/Cursor:
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "Python: Select Interpreter"
   - Choose the venv you just created: `./venv/bin/python`

#### Option 2: Disable Auto-Install

1. Open VS Code/Cursor settings
2. Search for: `python.venv.installPackage`
3. Set to: `false` or uncheck the option

#### Option 3: Use Conda Environment

If you're using Anaconda/Miniconda:

```bash
conda create -n ai-job-dashboard python=3.11
conda activate ai-job-dashboard
pip install -r requirements.txt
```

### Why This Happens

The Python extension tries to install the project in editable mode (`pip install -e .`), but this project is structured as a scripts-only project, not a Python package. The `pyproject.toml` and `setup.py` files are provided for compatibility, but the project is designed to be run directly without installation.

### Verification

After setup, verify everything works:

```bash
# Test imports
python -c "import pandas; import prophet; print('Dependencies OK')"

# Run pipeline with sample data
export USE_SAMPLE_DATA=true
python scripts/run_full_pipeline.py
```

If you see "Dependencies OK" and the pipeline runs, you're all set!

## Other Common Issues

### ModuleNotFoundError

**Solution**: Ensure virtual environment is activated and dependencies are installed:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Prophet Installation Issues

Prophet requires system dependencies. On macOS:
```bash
brew install cmake
pip install prophet
```

On Linux (Ubuntu/Debian):
```bash
sudo apt-get install cmake
pip install prophet
```

### Frontend Build Errors

**Solution**: Ensure Node.js dependencies are installed:
```bash
npm install
npm run build
```

