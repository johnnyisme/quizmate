# Release Notes

QuizMate 版本發布紀錄

## 版本列表

- [v1.1.0](./RELEASE_NOTES_v1.1.0.md) - 多圖片上傳支援 (2026-01-03)
- [v1.0.0](./RELEASE_NOTES_v1.0.0.md) - 首個穩定版本 (2025-12)

## 版本命名規則

我們遵循 [Semantic Versioning](https://semver.org/lang/zh-TW/) 規範：

- **主版本號 (Major)**：重大功能變更或不相容的 API 修改
- **次版本號 (Minor)**：新增功能但保持向下相容
- **修訂號 (Patch)**：Bug 修復和小幅改進

## 發布流程

1. 更新 `package.json` 版本號
2. 創建 release notes 文件於 `docs/releases/` 目錄
3. 更新此 README.md 的版本列表
4. 提交並推送到 GitHub
5. 在 GitHub 上創建對應的 Release 和 Tag
