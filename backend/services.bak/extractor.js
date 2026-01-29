async function onArchiveFound(localPath, scanTaskId, vulnId) {
  const fileBuffer = await fs.promises.readFile(localPath); 
  const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  await enqueueVTJob({ sha256, scan_task_id: scanTaskId, related_vuln_id: vulnId, file_path: localPath });

  await fs.promises.unlink(localPath).catch(()=>{});
}
