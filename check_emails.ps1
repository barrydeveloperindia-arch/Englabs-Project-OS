$Outlook = New-Object -ComObject Outlook.Application
if ($Outlook) {
    $Namespace = $Outlook.GetNameSpace("MAPI")
    $Inbox = $Namespace.GetDefaultFolder(6)
    $Inbox.Items | Sort-Object ReceivedTime -Descending | Select-Object -Property Subject, SenderName, ReceivedTime, Body -First 5 | ConvertTo-Json
} else {
    Write-Output "No Outlook"
}
