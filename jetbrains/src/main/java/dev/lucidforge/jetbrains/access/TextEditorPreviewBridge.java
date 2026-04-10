package dev.lucidforge.jetbrains.access;

import com.intellij.openapi.fileEditor.TextEditorWithPreview;
import com.intellij.openapi.util.Key;

/**
 * Bridge to access {@link TextEditorWithPreview#DEFAULT_LAYOUT_FOR_FILE}, which is
 * declared {@code internal} in Kotlin even though it's emitted as a public static
 * final field in bytecode. Java doesn't honor Kotlin's {@code internal} modifier,
 * so we re-export the field through a Java class and read it from Kotlin.
 */
public final class TextEditorPreviewBridge {
    private TextEditorPreviewBridge() {}

    public static final Key<TextEditorWithPreview.Layout> DEFAULT_LAYOUT_FOR_FILE =
            TextEditorWithPreview.DEFAULT_LAYOUT_FOR_FILE;
}
