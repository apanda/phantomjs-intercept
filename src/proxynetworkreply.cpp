#include "proxynetworkreply.h"
#include "terminal.h"

ProxyNetworkReply::ProxyNetworkReply(QNetworkAccessManager* access, QNetworkReply* proxied, QObject* parent) :
  QNetworkReply(parent),
  m_proxied(proxied) {
    Terminal::instance()->cout("New ProxyNetworkReply created");
    access->setManager(m_proxied);
    connect(m_proxied, SIGNAL(metaDataChanged()), SIGNAL(metaDataChanged()));
    connect(m_proxied, SIGNAL(finished()), SIGNAL(finished()));
    connect(m_proxied, SIGNAL(error(QNetworkReply::NetworkError)),
                     SIGNAL(error(QNetworkReply::NetworkError)));
    connect(m_proxied, SIGNAL(encrypted()), SIGNAL(encrypted()));
    connect(m_proxied, SIGNAL(sslErrors(const QList<QSslError>&)),
                     SIGNAL(sslErrors(const QList<QSslError>&)));
    connect(m_proxied, SIGNAL(uploadProgress(qint64, qint64)),
                     SIGNAL(uploadProgress(qint64, qint64)));
    connect(m_proxied, SIGNAL(downloadProgress(qint64, qint64)),
                     SIGNAL(downloadProgress(qint64, qint64)));
    connect(m_proxied, SIGNAL(aboutToClose()),
                     SIGNAL(aboutToClose()));
    connect(m_proxied, SIGNAL(bytesWritten(qint64)),
                     SIGNAL(bytesWritten(qint64)));
    connect(m_proxied, SIGNAL(readChannelFinished()),
                     SIGNAL(readChannelFinished()));
    connect(m_proxied, SIGNAL(readyRead()),
                     SIGNAL(readyRead()));
    // Hook up signals
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
