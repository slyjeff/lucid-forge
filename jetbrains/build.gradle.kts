plugins {
    id("java")
    id("org.jetbrains.kotlin.jvm") version "2.0.21"
    id("org.jetbrains.kotlin.plugin.serialization") version "2.0.21"
    id("org.jetbrains.intellij.platform") version "2.14.0"
}

group = "dev.lucidforge"
version = "0.1.0"

repositories {
    mavenCentral()
    intellijPlatform {
        defaultRepositories()
    }
}

dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")

    intellijPlatform {
        intellijIdeaCommunity("2024.2")
    }
}

intellijPlatform {
    pluginConfiguration {
        ideaVersion {
            sinceBuild = "242"
            untilBuild = "243.*"
        }
    }
    pluginVerification {
        ides {
            recommended()
        }
    }
}

kotlin {
    jvmToolchain(21)
}

// We don't use Swing .form files or @NotNull runtime checks, so the bytecode
// instrumentation step has nothing to do — and on this machine it fails trying
// to locate JDK packages in the wrong path. Disable it.
tasks.named("instrumentCode") { enabled = false }
tasks.named("instrumentTestCode") { enabled = false }

// We don't contribute any Settings pages, so the headless searchable-options
// indexer has nothing to do. Skipping it speeds up the build and avoids a
// flaky headless IDE boot.
tasks.named("buildSearchableOptions") { enabled = false }
