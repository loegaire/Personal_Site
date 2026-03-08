PYTHON := /home/thinh/proj/personal-site/.venv/bin/python

.PHONY: build watch new

build:
	$(PYTHON) tools/build_writeups.py

watch:
	$(PYTHON) tools/watch_writeups.py

new:
	@if [ -z "$(TITLE)" ]; then echo "Usage: make new TITLE='My Writeup'"; exit 1; fi
	$(PYTHON) tools/new_writeup.py "$(TITLE)"