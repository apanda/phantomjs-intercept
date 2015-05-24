#include "proxynetworkreply.h"
#include "terminal.h"

ProxyNetworkReply::ProxyNetworkReply(QNetworkAccessManager* access, QNetworkReply* proxied, QObject* parent) :
  QNetworkReply(parent),
  m_proxied(proxied) {
    Terminal::instance()->cout("New ProxyNetworkReply created");
    access->setManager(m_proxied);
    
    // Hook up signals
    connect(m_proxied, SIGNAL(metaDataChanged()), this, SLOT (metaDataChanged()));
    connect(m_proxied, SIGNAL(finished()), this, SLOT(finished()));
    connect(m_proxied, SIGNAL(error(QNetworkReply::NetworkError)), this,
                     SLOT(error(QNetworkReply::NetworkError)));
    connect(m_proxied, SIGNAL(encrypted()), this, SLOT (encrypted()));
    connect(m_proxied, SIGNAL(sslErrors(const QList<QSslError>&)), this,
                     SLOT(sslErrors(const QList<QSslError>&)));
    connect(m_proxied, SIGNAL(uploadProgress(qint64, qint64)), this,
                     SLOT(uploadProgress(qint64, qint64)));
    connect(m_proxied, SIGNAL(downloadProgress(qint64, qint64)), this,
                     SLOT(downloadProgress(qint64, qint64)));
    connect(m_proxied, SIGNAL(aboutToClose()), this,
                     SLOT(aboutToClose()));
    connect(m_proxied, SIGNAL(bytesWritten(qint64)), this,
                     SLOT(bytesWritten(qint64)));
    connect(m_proxied, SIGNAL(readChannelFinished()), this,
                     SLOT(readChannelFinished()));
    connect(m_proxied, SIGNAL(readyRead()), this,
                     SLOT(readyRead()));
}

ProxyNetworkReply::~ProxyNetworkReply() {}

// reimplemented from QIODevice
void ProxyNetworkReply::close() {
    Terminal::instance()->cout("ProxyNetworkReply closed");
    m_proxied->close();
}
bool ProxyNetworkReply::isSequential() const {
    Terminal::instance()->cout("ProxyNetworkReply isSequential");
    return m_proxied->isSequential();
}

void ProxyNetworkReply::setReadBufferSize(qint64 size) {
    Terminal::instance()->cout("ProxyNetworkReply setReadBufferSize");
    return m_proxied->setReadBufferSize(size);
}

void ProxyNetworkReply::abort() {
    Terminal::instance()->cout("ProxyNetworkReply abort");
    return m_proxied->abort();
}

void ProxyNetworkReply::ignoreSslErrors() {
    return m_proxied->ignoreSslErrors();
}

qint64 ProxyNetworkReply::writeData(const char *data, qint64 len) {
    Terminal::instance()->cout("ProxyNetworkReply write");
    return m_proxied->write(data, len);
}

qint64 ProxyNetworkReply::readData(char *data, qint64 len) {
    Terminal::instance()->cout("Reading data");
    return m_proxied->read(data, len);
}

void ProxyNetworkReply::metaDataChangedSlot() {
    Terminal::instance()->cout("metaDataChanged");
    emit metaDataChanged();
}

void ProxyNetworkReply::finishedSlot() {
    Terminal::instance()->cout("finished");
    emit finished();
}

void ProxyNetworkReply::errorSlot(QNetworkReply::NetworkError err) {
    Terminal::instance()->cout(QString("error %1").arg(err));
    emit error(err);
}

void ProxyNetworkReply::encryptedSlot() {
    Terminal::instance()->cout("encrypted");
    emit encrypted();
}

void ProxyNetworkReply::sslErrorsSlot(const QList<QSslError> &errs) {
    Terminal::instance()->cout("ssl errors");
    emit sslErrors(errs);
}

void ProxyNetworkReply::uploadProgressSlot(qint64 a, qint64 b) {
    Terminal::instance()->cout("uploadProgress");
    emit uploadProgress(a, b);
}

void ProxyNetworkReply::downloadProgressSlot(qint64 a, qint64 b) {
    Terminal::instance()->cout("downloadProgress");
    emit downloadProgress(a, b);
}

void ProxyNetworkReply::aboutToCloseSlot() {
    Terminal::instance()->cout("aboutToClose");
    emit aboutToClose();
}

void ProxyNetworkReply::bytesWrittenSlot(qint64 bytes) {
    Terminal::instance()->cout("bytesWritten");
    emit bytesWritten(bytes);
}

void ProxyNetworkReply::readChannelFinishedSlot() {
    Terminal::instance()->cout("readChannelFinished");
    emit readChannelFinished();
}

void ProxyNetworkReply::readyReadSlot() {
    Terminal::instance()->cout("readyRead");
    emit readyRead();
}
